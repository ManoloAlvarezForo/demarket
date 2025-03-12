// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

using SafeERC20 for IERC20;

contract DeMarket is ReentrancyGuard, EIP712 {
    using ECDSA for bytes32;

    struct Item {
        address seller;
        address token;
        string name;
        uint256 price; // Price in ETH per token (in Wei)
        uint256 quantity;
    }

    mapping(uint256 => Item) public items;
    mapping(address => uint256) public balances;
    mapping(address => uint256) public nonces;

    uint256 public itemCount;
    string private constant SIGNING_DOMAIN = "Marketplace";
    string private constant SIGNATURE_VERSION = "1";

    event ItemListed(
        uint256 indexed itemId,
        address indexed seller,
        address indexed token,
        string name,
        uint256 price,
        uint256 quantity
    );
    event ItemPurchased(
        uint256 indexed itemId,
        address indexed buyer,
        uint256 quantity
    );
    event FundsWithdrawn(address indexed seller, uint256 amount);
    event ItemAuthorized(
        address indexed seller,
        uint256 indexed itemId,
        bytes signature
    );
    event TransferExecuted(
        address indexed tokenAddress,
        address indexed from,
        address indexed to,
        uint256 amount
    );

    constructor() EIP712(SIGNING_DOMAIN, SIGNATURE_VERSION) {}

    /**
     * @notice List a certain amount of ERC-20 tokens for sale at a specified price in Ether.
     */
    function listItem(
        address _token,
        string calldata _name,
        uint256 _price,
        uint256 _quantity
    ) external nonReentrant {
        require(_token != address(0), "Invalid token address");
        require(_price > 0, "Price must be greater than zero");
        require(_quantity > 0, "Quantity must be greater than zero");
        require(IERC20(_token).totalSupply() > 0, "Invalid ERC-20 token");

        itemCount++;
        items[itemCount] = Item(msg.sender, _token, _name, _price, _quantity);

        emit ItemListed(
            itemCount,
            msg.sender,
            _token,
            _name,
            _price,
            _quantity
        );
    }

    /**
     * @notice Buy a listed item by paying ETH and receiving the ERC-20 tokens.
     */
    function purchaseItem(
        uint256 _itemId,
        uint256 _quantity
    ) external payable nonReentrant {
        Item storage item = items[_itemId];
        require(item.seller != address(0), "Item does not exist");
        require(
            _quantity > 0 && _quantity <= item.quantity,
            "Invalid quantity"
        );

        uint256 totalPrice = _quantity * item.price;
        require(msg.value == totalPrice, "Incorrect Ether sent");

        IERC20 token = IERC20(item.token);
        require(
            token.allowance(item.seller, address(this)) >= _quantity,
            "Marketplace not approved"
        );

        // Transfer tokens safely using SafeERC20
        token.safeTransferFrom(item.seller, msg.sender, _quantity);

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
        require(
            _quantity > 0 && _quantity <= item.quantity,
            "Invalid quantity"
        );

        bytes32 digest = _hashTypedDataV4(
            keccak256(
                abi.encode(
                    keccak256(
                        "ItemAuthorization(uint256 itemId,uint256 quantity,address seller,uint256 nonce)"
                    ),
                    _itemId,
                    _quantity,
                    item.seller,
                    nonces[item.seller]
                )
            )
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

    /**
     * @notice Executes a token transfer from one address to another.
     * @dev This function is used to transfer ERC-20 tokens on behalf of a user.
     * It requires that the caller has sufficient allowance from the `from` address.
     * Emits a `TransferExecuted` event upon successful transfer.
     * @param tokenAddress The address of the ERC-20 token contract.
     * @param from The address from which tokens will be transferred.
     * @param to The address to which tokens will be transferred.
     * @param amount The amount of tokens to transfer.
     * @return success Returns true if the transfer is successful, otherwise reverts.
     */
    function executeTransfer(
        address tokenAddress,
        address from,
        address to,
        uint256 amount
    ) external nonReentrant returns (bool success) {
        require(tokenAddress != address(0), "Invalid token address");
        require(from != address(0), "Invalid sender address");
        require(to != address(0), "Invalid recipient address");
        require(amount > 0, "Amount must be greater than zero");
        require(
            IERC20(tokenAddress).transferFrom(from, to, amount),
            "Transfer failed"
        );

        emit TransferExecuted(tokenAddress, from, to, amount);
        return true;
    }
}
