

App = {
	web3Provider: null,
	contracts: {},
	mypageId: null,

	init: function() {
		$.getJSON('../real-estate.json', function(data) {
			var list = $('#list');
			var template = $('#template');

			for (i = 0; i < data.length; i++) {
				// template.find('.progress-bar').attr('aria-valuenow',data[i].progress);
				template.find('.progress-bar').css('width',data[i].progress+'%');
				template.find('.progress-bar').text(data[i].progress+'%');
				template.find('img').attr('src', data[i].picture);
				template.find('.id').text(data[i].id);
				template.find('.type').text(data[i].type);
				template.find('.area').text(data[i].area);
				template.find('.price').text(data[i].price);

				list.append(template.html());
			}


		});



		return App.initWeb3();
	},

	initWeb3: function() {
		if (typeof web3 !== 'undefined') {
			App.web3Provider = web3.currentProvider;
			web3 = new Web3(web3.currentProvider);
		} else {
			App.web3Provider = new web3.providers.HttpProvider('http://localhost:8545');
			web3 = new Web3(App.web3Provider);
		}

		return App.initContract();
	},

	initContract: function() {
		$.getJSON('RealEstate.json', function(data) {
			App.contracts.RealEstate = TruffleContract(data);
			App.contracts.RealEstate.setProvider(App.web3Provider);
			App.listenToEvents();
			App.listenToPayEvents();
		});
		// changed part





		web3.eth.getAccounts(function(error,accounts){
			var account= accounts[0];
			$('#connectedAccount').text(account);

			App.contracts.RealEstate.deployed().then(function(instance){
				return instance.getIdByBuyerAddress.call(account);
			}).then(function(accountId){
				App.mypageId=accountId;
				$('#placeName').text(App.mypageId);

				if(App.mypageId==0){
					$('.profilepic').find('img').attr('src','images/room'+App.mypageId+'.jpg');
				}else{
					$('.profilepic').find('img').attr('src','images/room'+App.mypageId+'.png');
				}

			});

			// App.contracts.RealEstate.deployed().then(function(e){
			// 	return e.getRemainMonths.call(id);
			// }).then(function(remain){
			// 	$('#remainMonths').text(remain);
			// });

		});
		//
		// App.contracts.RealEstate.deployed().then(function(e){
		// 	return e.getRemainMonths.call(id);
		// }).then(function(remain){
		// 	$('#remainMonths').text(remain);
		// });






		// $('#connectedAccount').text(account);
		// $('#placeName').text(id);
		// $('#contractRemainMonths').text(contractMonths);
		//
		// changed part end


	},

	buyRealEstate: function() {
		var id = $('#id').val();
		var name = $('#name').val();
		var price = $('#price').val();
		var depositPlusFirstRent=price*3;
		var age = $('#age').val();
		var contractMonths = $('#contractMonths').val();

		web3.eth.getAccounts(function(error, accounts) {
			if (error) {
				console.log(error);
			}
			var account = accounts[0];
			//changed part

			//changed part end
			App.contracts.RealEstate.deployed().then(function(instance) {
				var nameUtf8Encoded = utf8.encode(name);
				return instance.buyRealEstate(id, web3.toHex(nameUtf8Encoded), age,contractMonths, { from: account, value: depositPlusFirstRent });
			}).then(function() {
				$('#name').val('');
				$('#age').val('');
				$('#buyModal').modal('hide');
				$('#contractMonths').val('');
			}).catch(function(err) {
				console.log(err.message);
			});
		});
	},

	payRealEstate: function(){

		$.getJSON('../real-estate.json', function(data) {

			for (i = 0; i < data.length; i++) {
				if(App.mypageId==data[i].id){
					var rentFeeWon = data[i].price*315000;

					$('#rentFee').text(rentFeeWon);

				}

			}
		});

		web3.eth.getAccounts(function(error,accounts){
			var account =accounts[0];

			App.contracts.RealEstate.deployed().then(function(instance){
				return instance.payRent(App.mypageId,{ from: account, value: 3*10**18});
			}).catch(function(err){
				console.log(err.message);
			})

		});


	},
	cancelTheContract: function(){
		web3.eth.getAccounts(function(error,accounts){
			var account =accounts[0];

			App.contracts.RealEstate.deployed().then(function(instance){
				return instance.cancelContract(App.mypageId);
			}).catch(function(err){
				console.log(err.message);
			})

		});




	},


	loadRealEstates: function() {
		App.contracts.RealEstate.deployed().then(function(instance) {
			return instance.getAllBuyers.call();
		}).then(function(buyers) {
			for (i = 0; i < buyers.length; i++) {
				if (buyers[i] !== '0x0000000000000000000000000000000000000000') {
					var imgType = $('.panel-realEstate').eq(i).find('img').attr('src').substr(11,1);
					if(i==0){
						$('.panel-realEstate').eq(i).find('img').attr('src','images/room'+imgType+'_sold.jpg');
					}else{
						$('.panel-realEstate').eq(i).find('img').attr('src','images/room'+imgType+'_sold.png');
					}
					// switch(imgType) {
					//   case 'room0.jpg':
					//     $('.panel-realEstate').eq(i).find('img').attr('src', 'images/room0_sold.jpg')
					//     break;
					//   case 'room.jpg':
					//     $('.panel-realEstate').eq(i).find('img').attr('src', 'images/townhouse_sold.jpg')
					//     break;
					//   case 'house.jpg':
					//     $('.panel-realEstate').eq(i).find('img').attr('src', 'images/house_sold.jpg')
					//     break;
					// }

					$('.panel-realEstate').eq(i).find('.btn-buy').text('매각').attr('disabled', true);
					$('.panel-realEstate').eq(i).find('.btn-buyerInfo').removeAttr('style');
				}
			}
		}).catch(function(err) {
			console.log(err.message);
		})
	},

	listenToEvents: function() {
		App.contracts.RealEstate.deployed().then(function(instance) {
			instance.LogBuyRealEstate({}, { fromBlock: 0, toBlock: 'latest' }).watch(function(error, event) {
				if (!error) {
					$('#events').append('<button class="list-group-item list-group-item-action">' + event.args._buyer + ' 계정에서 이름이'+web3.toUtf8(event.args._name)+'인 루미가' + event.args._id + '번 건물에 입주하게 되었습니다 :) 축하드려용' + '</button>');
				} else {
					console.error(error);
				}
				App.loadRealEstates();
			})
		})
	},
	listenToPayEvents: function(){
		App.contracts.RealEstae.deployed().then(function(instance){
			instance.LogPayRent({},{fromBlock: 0, toBlock:'latest'}).watch(function(error,event){
				if(!error){
					$('#payEvents').append('<li>'+event.args._buyer+'계정님이'+event.args._id+'건물의 월세를 지급하셨군요</li>');
				}else{
					console.error(error);
				}
			})
		});
	}

	// app이 끝나는 지점
};

$(function() {
	$(window).load(function() {
		App.init();
	});

	$('#buyModal').on('show.bs.modal', function(e) {
		var id = $(e.relatedTarget).parent().find('.id').text();
		var price = web3.toWei(parseFloat($(e.relatedTarget).parent().find('.price').text() || 0), "ether");

		$(e.currentTarget).find('#id').val(id);
		$(e.currentTarget).find('#price').val(price);



		$.getJSON('../real-estate.json', function(data) {

			for (i = 0; i < data.length; i++) {
				if(id==data[i].id){
					var feeWon = data[i].price*315000;
					var depositWon=data[i].price*2*315000;
					var totalFeeEther= data[i].price*3;
					var totalFeeWon = totalFeeEther*315000;
					$(e.currentTarget).find('#montlyFee').text(feeWon);
					$(e.currentTarget).find('#deposit').text(depositWon);
					$(e.currentTarget).find('#totalFeeEther').text(totalFeeEther);
					$(e.currentTarget).find('#totalFeeWon').text(totalFeeWon);
					$(e.currentTarget).find('#totalFeeWon2').text(totalFeeWon);
				}

			}
		});



	});

	$('#buyerInfoModal').on('show.bs.modal', function(e) {
		var id = $(e.relatedTarget).parent().find('.id').text();

		App.contracts.RealEstate.deployed().then(function(instance) {
			return instance.getBuyerInfo.call(id);
		}).then(function(buyerInfo) {
			$(e.currentTarget).find('#buyerAddress').text(buyerInfo[0]);
			$(e.currentTarget).find('#buyerName').text(web3.toUtf8(buyerInfo[1]));
			$(e.currentTarget).find('#buyerAge').text(buyerInfo[2]);
		}).catch(function(err) {
			console.log(err.message);
		})
	});

	$('#roomieInfoModal').on('show.bs.modal',function(e){

		var id = $(e.relatedTarget).parent().find('.id').text();
		$(e.currentTarget).find('#productId').text(id);
		$.getJSON('../real-estate-roomies.json',function(data){
			for (i = 0; i < data.length; i++) {
				if(id==data[i].id){
					$(e.currentTarget).find('#description').text(data[i].description);
					$(e.currentTarget).find('#contract').text('최소 '+data[i].contract+' 개월 계약을 진행하고 있어요 :)');
					$(e.currentTarget).find('#roomieNumber').text(data[i].max_roomies+'명 방에 현재 '+data[i].now_roomies+'명의 루미들이 거주하고 있습니다.');
					$(e.currentTarget).find('#roomieAge').text(data[i].roomies_info[0].age);
					$(e.currentTarget).find('#sleepTime').text(data[i].roomies_info[0].sleep_time);
					$(e.currentTarget).find('#roomieName').text(data[i].roomies_info[0].name);


				}

			}




		})






	})





});
