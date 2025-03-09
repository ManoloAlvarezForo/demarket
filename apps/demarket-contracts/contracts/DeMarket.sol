// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol"; // Nueva importación

contract DeMarket is Ownable, ReentrancyGuard {
    using ECDSA for bytes32;
    uint256 public itemCount;


    constructor(address initialOwner) Ownable(initialOwner) {
        itemCount = 0;
    }

    struct Item {
        address seller;
        uint256 price;
        uint256 quantity;
        address token;
    }

    mapping(uint256 => Item) public items;
    mapping(address => mapping(address => uint256)) public allowances; // Mapping to store allowed transfer amounts

    event ItemListed(uint256 indexed itemId, address indexed seller, address token, uint256 price, uint256 quantity);
    event ItemPurchased(uint256 indexed itemId, address indexed buyer, uint256 quantity);
    event FundsWithdrawn(address indexed seller, uint256 amount);
    event ItemAuthorized(address indexed seller, uint256 indexed itemId, bytes signature);

    // List an item for sale
    function listItem(address _token, uint256 _price, uint256 _quantity) public {
        require(_token != address(0), "Invalid token address");
        require(_price > 0, "Price must be greater than 0");
        require(_quantity > 0, "Quantity must be greater than 0");

        itemCount++;
        items[itemCount] = Item(msg.sender, _price, _quantity, _token);
        emit ItemListed(itemCount, msg.sender, _token, _price, _quantity);
    }

    // Purchase an item from the marketplace
    function purchaseItem(uint256 _itemId, uint256 _quantity) public payable nonReentrant {
        require(_itemId > 0 && _itemId <= itemCount, "Invalid item ID");
        require(_quantity > 0, "Quantity must be greater than 0");

        Item storage item = items[_itemId];
        require(item.quantity >= _quantity, "Not enough tokens available");

        uint256 totalPrice = item.price * _quantity;
        require(msg.value >= totalPrice, "Insufficient Ether sent");

        // Transfer tokens from seller to buyer
        bool success = IERC20(item.token).transferFrom(item.seller, msg.sender, _quantity);
        require(success, "Token transfer failed");

        // Update item quantity
        item.quantity -= _quantity;

        // Transfer Ether to seller
        (bool sent, ) = item.seller.call{value: msg.value}("");
        require(sent, "Failed to send Ether");

        emit ItemPurchased(_itemId, msg.sender, _quantity);
    }

    // Withdraw funds (Ether) from the contract
    function withdrawFunds() public onlyOwner nonReentrant {
        uint256 amount = address(this).balance;
        require(amount > 0, "No funds to withdraw");

        (bool sent, ) = owner().call{value: amount}("");
        require(sent, "Failed to send Ether");

        emit FundsWithdrawn(msg.sender, amount);
    }

    // Allow sellers to pre-authorize token listings using signed messages
    function authorizeItem(uint256 _itemId, bytes calldata _signature) public {
        Item storage item = items[_itemId];
        require(item.seller == msg.sender, "Only seller can authorize item");

        bytes32 message = keccak256(abi.encodePacked(address(this), _itemId));
        bytes32 messageHash = MessageHashUtils.toEthSignedMessageHash(message); // Usa MessageHashUtils
        address signer = messageHash.recover(_signature);

        require(signer == msg.sender, "Invalid signature");
        allowances[msg.sender][item.token] = item.quantity;

        emit ItemAuthorized(msg.sender, _itemId, _signature);
    }
}
