pragma solidity ^0.4.23;

contract RealEstate {

    //OWNER STATUS CHECK
    //SIMPLE ESCROW FUNCTION

    uint8 public ownerStatus=0; //This will check whether there is any unpaid deposit.

    uint8 depositAllPaid = 0; //Then this owner can withdraw roomies monthly rent.
    uint8 depositNotPaid = 1; //If there is any unpaid deposit, owner can't withdraw money from contract.



    struct Buyer {
        address buyerAddress;
        bytes32 name;
        uint age;
        uint contractMonths;
    }

    mapping (uint => Buyer) public buyerInfo;
		mapping(address => uint) public buyerAddressToId; //this will return builing's id

    address public owner;
    address[10] public buyers;

    event LogBuyRealEstate(
        address _buyer,
        uint _id,
		bytes32 _name
    );

    event LogPayRent(

        address _buyer,
        uint _id

        );

    constructor() public {
        owner = msg.sender;
    }

    //Roomie will pay with this for their very first payment : deposit + first monthly rent

    function buyRealEstate(uint _id, bytes32 _name, uint _age,uint _contractMonths) public payable {
        require(_id >= 0 && _id <= 9);
        buyers[_id] = msg.sender; //Becuase this is not dynamic array. Need to change this to dynamic array for beta ver2
        buyerInfo[_id] = Buyer(msg.sender, _name, _age,_contractMonths);
				buyerAddressToId[msg.sender]=_id;
        if(ownerStatus==depositAllPaid){
            owner.transfer(msg.value); // If it is not it will be stored in contract balance
        }

        emit LogBuyRealEstate(msg.sender, _id,_name);
    }

    function payRent(uint _id) public payable{
        require(msg.value > 0);
        require(buyerInfo[_id].contractMonths > 0);

        buyerInfo[_id].contractMonths--; //Need to change this to SafeMath for avoiding future problem.
        if(ownerStatus==depositAllPaid){
            owner.transfer(msg.value);
        }


        if(buyerInfo[_id].contractMonths==0){
            ownerStatus=depositNotPaid;
        }

        emit LogPayRent(msg.sender,_id);
    }

    function cancelContract(uint _id) external {
        //require(buyerInfo[_id].buyerAddress==msg.sender);
        //require(buyerInfo[_id].contractMonths > 0);

        buyerInfo[_id].contractMonths=0;
        //owner should pay deposit to this person
        ownerStatus=depositNotPaid;

    }

    function withdrawMoney() public {
        require(ownerStatus==depositAllPaid);
        require(msg.sender==owner);

        owner.transfer(address(this).balance);


    }

 		function getIdByBuyerAddress(address _address) public view returns(uint){
			return buyerAddressToId[_address];
		}



    function getBuyerInfo(uint _id) public view returns (address, bytes32, uint,uint) {
        Buyer memory buyer = buyerInfo[_id];
        return (buyer.buyerAddress, buyer.name, buyer.age,buyer.contractMonths);
    }

    function getAllBuyers() public view returns (address[10]) {
        return buyers;
    }

    function getRemainMonths(uint _id) public view returns(uint){
        Buyer memory buyer = buyerInfo[_id];
        return buyer.contractMonths;
    }
}
