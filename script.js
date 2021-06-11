function randomInteger(min, max) {
	let rand = min + Math.random() * (max + 1 - min);
	return Math.floor(rand);
}
let login = randomInteger(1000, 9999).toString();
let socket = new WebSocket("ws://websocket:2346/?user="+login);
let nowGame = '';
let nowTags = [];
$('#tags').tagsInput({
	height:'50px',
	width:'400px'});
socket.onopen = function(e) {
//	socket.send(JSON.stringify({user:login, message:'Hello'}));
};
  socket.onmessage = function(event) {
	console.log(`[message] Данные получены с сервера: ${event.data}`);
  };
  
  socket.onclose = function(event) {
	if (event.wasClean) {
		console.log(`[close] Соединение закрыто чисто, код=${event.code} причина=${event.reason}`);
	} else {
	  console.log('[close] Соединение прервано');
	}
  };
  
  socket.onerror = function(error) {
	console.log(`[error] ${error.message}`);
  };

function clearGameBoard(){
	$('#content').html(' ');
}

function gettingBoard() {
	socket.onmessage = function(data) {
		let ans = JSON.parse(data.data)
		if(ans=='Draw!' || ans=='You WIN!' || ans=='You LOSE!'){
			alert(ans);
			var html = renderNet(true);
			$('#content').html(html);
			return;
		} else {
			nowGame = ans.name
			nowTags = ans.tags
			var html = renderNet();
			$('#content').html(html);
			let iam = (login=ans.player1)?((ans.turn=1)?true:false):((ans.turn=2)?true:false)
			startGame(iam,ans.board)
		}
	}
}

function gettingGames(){
	socket.onmessage = function(data) {
		let html = `<div class="home"><div class="row row-cols-3">`
		let ans = JSON.parse(data.data)
		let tagsElem = document.querySelectorAll('.tag span')
		let tags = [];
		tagsElem.forEach(function(item,index){
			tags[index]=item.textContent.trim()
		})
		ans.forEach(function(item,index){
			if(item['player2']==false && compArr(item.tags,tags)){
				html = html + `
					<div class="col-4">
						<div class="show" game="`+item.name+`">
							<div class="headshow">
								<h4>`+item.name+`</h1>
								<p>`+((item.tags)?item.tags:'none')+`</p>
							</div>
							<div class="row row-cols-3">`;
				item['board'].forEach(function (item){
					html = html + 	`<div class="col-4 ga"><img src="`+changeMark(item)+`"></div>`
				});
				html = html + `</div></div></div>`;
			}
		})
		html = html + `</div></div>`
		$('#content').html(html);
		let allgames = document.querySelectorAll('.show')
		allgames.forEach(function(item){
			item.addEventListener('click',function(){
				socket.send(JSON.stringify({type:'join', name:this.getAttribute('game')}));
				nowGame = this.getAttribute('game');
				gettingBoard();
			})
		})
	}
}

document.querySelector('#new').addEventListener('click',function(){
	nowGame = prompt('Enter name game!','Game1');
	let tagsElem = document.querySelectorAll('.tag span')
	let tags = [];
	tagsElem.forEach(function(item,index){
		tags[index]=item.textContent.trim()
	})
	socket.send(JSON.stringify({type:'new',name:nowGame,tags:tags}));
	gettingBoard();
});

document.querySelector('#home').addEventListener('click',function(){
	socket.send(JSON.stringify({type:'home'}));
	gettingGames();
});

function startGame(turn,numOfBoard){
	var checkWin = [[0,1,2] , [3,4,5] , [6,7,8] , [0,3,6] , [1,4,7] , [2,5,8] , [0,4,8] , [2,4,6]]
	renderBoard(false,numOfBoard);

	function endGame(winStr,winner){
		if(winStr==0 && winner==0){
			return 3
		}
		checkWin[winStr].forEach(function(currentValue){
			let t = document.querySelector('#i'+(currentValue+1))
			t.setAttribute('src', 'win.JPG')
		});
		return winner
	}

	function renderBoard(end) {
		let gameBoard = document.querySelectorAll('.change img')
		gameBoard.forEach(function(item,index){
			if(numOfBoard[index]==1){
				item.setAttribute('src','mark1.JPG')}
			if(numOfBoard[index]==2){
				item.setAttribute('src','mark2.JPG')}
			if(numOfBoard[index]==0){
				item.addEventListener('click', function () {
					socket.send(JSON.stringify({type:'old',name:nowGame,choose:index}));
				})
			}
		})
	}
}

function changeMark(mark){
	if(mark===0){
		return 'empty.JPG'
	}
	if(mark===1){
		return 'mark1.JPG'
	}
	if(mark===2){
		return 'mark2.JPG'
	}
}

function renderNet(empty) {
	if(!empty){
		let tagsElem = document.querySelectorAll('.tag span')
		let tags = [];
		tagsElem.forEach(function(item,index){
			tags[index]=item.textContent.trim()
		})
		html = `
			<div class="game">
				<h6>Name: `+ nowGame +`</h4>
				<h8>Tags: `+ nowTags +`</h5>
				<div class="row">
					<div class="change" ><img id="i1" src="empty.jpg"/></div>
					<div class="change" ><img id="i2" src="empty.jpg"/></div>
					<div class="change" ><img id="i3" src="empty.jpg"/></div>
				</div>
				<div class="row">
					<div class="change" ><img id="i4" src="empty.jpg"/></div>
					<div class="change" ><img id="i5" src="empty.jpg"/></div>
					<div class="change" ><img id="i6" src="empty.jpg"/></div>
				</div>
				<div class="row">
					<div class="change" ><img id="i7" src="empty.jpg"/></div>
					<div class="change" ><img id="i8" src="empty.jpg"/></div>
					<div class="change" ><img id="i9" src="empty.jpg"/></div>
				</div>
			</div>
		`
	} else {
		html = `
			<div class="game">
			</div>
			`
	}
	return html
}

    $.fn.serializeObject = function(){
        var o = {};
        var a = this.serializeArray();
        $.each(a, function() {
            if (o[this.name] !== undefined) {
                if (!o[this.name].push) {
                    o[this.name] = [o[this.name]];
                }
                o[this.name].push(this.value || '');
            } else {
                o[this.name] = this.value || '';
            }
        });
        return o;
    };
	
function compArr(arr1,arr2){
	if(arr2!=false){
		let res = arr1.some(function isBiggerThan10(element, index, array) {return arr2.includes(element);})
		return res
	}
	return true;
}