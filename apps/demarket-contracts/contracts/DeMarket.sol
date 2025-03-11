// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

contract DeMarket is ReentrancyGuard, EIP712 {
    using ECDSA for bytes32;

    struct Item {
        address seller;
        address token;
        uint256 price; // Price in ETH per token
        uint256 quantity;
    }

    mapping(uint256 => Item) public items;
    mapping(address => uint256) public balances;
    mapping(address => uint256) public nonces;

    uint256 public itemCount;
    string private constant SIGNING_DOMAIN = "Marketplace";
    string private constant SIGNATURE_VERSION = "1";

    event ItemListed(uint256 indexed itemId, address indexed seller, address indexed token, uint256 price, uint256 quantity);
    event ItemPurchased(uint256 indexed itemId, address indexed buyer, uint256 quantity);
    event FundsWithdrawn(address indexed seller, uint256 amount);
    event ItemAuthorized(address indexed seller, uint256 indexed itemId, bytes signature);

    constructor() EIP712(SIGNING_DOMAIN, SIGNATURE_VERSION) {}

    /**
     * @notice List a certain amount of ERC-20 tokens for sale at a specified price in Ether.
     */
    function listItem(address _token, uint256 _price, uint256 _quantity) external nonReentrant {
        require(_token != address(0), "Invalid token address");
        require(_price > 0, "Price must be greater than zero");
        require(_quantity > 0, "Quantity must be greater than zero");
        require(IERC20(_token).totalSupply() > 0, "Invalid ERC-20 token");

        itemCount++;
        items[itemCount] = Item(msg.sender, _token, _price, _quantity);

        emit ItemListed(itemCount, msg.sender, _token, _price, _quantity);
    }

    /**
     * @notice Buy a listed item by paying ETH and receiving the ERC-20 tokens.
     */
    function purchaseItem(uint256 _itemId, uint256 _quantity) external payable nonReentrant {
        Item storage item = items[_itemId];
        require(item.seller != address(0), "Item does not exist");
        require(_quantity > 0 && _quantity <= item.quantity, "Invalid quantity");
        
        uint256 totalPrice = _quantity * item.price;
        require(msg.value == totalPrice, "Incorrect Ether sent");

        IERC20 token = IERC20(item.token);
        require(token.allowance(item.seller, address(this)) >= _quantity, "Marketplace not approved");

        // Transfer tokens from seller to buyer
        (bool success, bytes memory data) = address(token).call(
            abi.encodeWithSelector(IERC20.transferFrom.selector, item.seller, msg.sender, _quantity)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "Token transfer failed");

        item.quantity -= _quantity;
        balances[item.seller] += msg.value;

        emit ItemPurchased(_itemId, msg.sender, _quantity);
    }

    /**
     * @notice Withdraw earned ETH from the marketplace.
     */
    function withdrawFunds() external nonReentrant {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "No funds to withdraw");
        balances[msg.sender] = 0;

        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        require(sent, "Withdraw failed");

        emit FundsWithdrawn(msg.sender, amount);
    }

    /**
     * @notice Authorize a sale using an EIP-712 signed message.
     */
    function authorizeItem(
        uint256 _itemId,
        uint256 _quantity,
        bytes calldata _signature
    ) external {
        Item memory item = items[_itemId];
        require(item.seller != address(0), "Item does not exist");
        require(_quantity > 0 && _quantity <= item.quantity, "Invalid quantity");

        bytes32 digest = _hashTypedDataV4(
            keccak256(abi.encode(
                keccak256("ItemAuthorization(uint256 itemId,uint256 quantity,address seller,uint256 nonce)"),
                _itemId,
                _quantity,
                item.seller,
                nonces[item.seller]
            ))
        );

        address signer = digest.recover(_signature);
        require(signer == item.seller, "Invalid signature");

        nonces[item.seller]++;
        emit ItemAuthorized(item.seller, _itemId, _signature);
    }

    /**
     * @notice Get the nonce for a seller to prevent replay attacks.
     */
    function getNonce(address _seller) external view returns (uint256) {
        return nonces[_seller];
    }

    /**
     * @notice Fallback function to prevent accidental ETH deposits.
     */
    receive() external payable {
        revert("Direct ETH deposits not allowed");
    }
}
