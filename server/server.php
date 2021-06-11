<?php
require_once __DIR__ . '/vendor/autoload.php';
use Workerman\Worker;

// массив для связи соединения пользователя и необходимого нам параметра
$users = [];
$games = [];

$clearBoard = [0,0,0,0,0,0,0,0,0];
$num = 0;

// создаём ws-сервер, к которому будут подключаться все наши пользователи
$ws_worker = new Worker("websocket://websocket:2346");
// создаём обработчик, который будет выполняться при запуске ws-сервера
$ws_worker->onWorkerStart = function() use (&$users){
    echo "Start!\n";
};

$ws_worker->onMessage = function($connection, $data) use (&$users,&$clearBoard,&$games) {
    $data = json_decode($data);
    // отправляем сообщение пользователю по userId
    $user = array_search($connection, $users);
    $que = 'ERROR';
    if (isset($user)){
        $que1=null;
        $wc=null;
        $que = 'OK.';
        $webconnection = $users[$user];

        if($data->type == 'home'){
            $que = $games;
        }

        if($data->type == 'new'){
            echo 'New Game: ',$data->name,"\n";
            array_push($games,['name'=>$data->name,'tags'=>$data->tags,'turn'=>1,'player1'=>$user,'player2'=>'','board'=>$clearBoard]);
            $que = array('name'=>$data->name,'turn' => 1,'tags'=>$data->tags, 'player1' => $user, 'player2' => '', 'board' => $clearBoard);
        } 

        if($data->type == 'join'){
            $key = array_search($data->name, array_column($games, 'name'));
            if($key===false){
                return false;
            }
            $game = $games[$key];
            if($game['player2']>0){
            } else {
                $games[$key]['player2'] = $user;
            }
            echo 'Join Player: ',$user,' in ',$data->name,"\n";
            $que = array('name'=>$games[$key]['name'],'tags'=>$games[$key]['tags'],'turn'=>1,'player1'=>$games[$key]['player1'],'player2'=>$games[$key]['player2'],'board'=>$games[$key]['board']);
        }

        if($data->type == 'old'){
            $win = false;
            $key = array_search($data->name, array_column($games, 'name'));
            if($key===false){
                return false;
            }
            $game = $games[$key];
            $turn = 'player' . $game['turn'];
            if($user==$game[$turn]){
                $valTurn = $game['turn'];
                $games[$key]['board'][$data->choose] = $valTurn;
                $win = winGame($games[$key]['board'],$valTurn);
                if ($valTurn==1){
                    $newTurn = 2;
                } else {
                    $newTurn = 1;
                }
                $games[$key]['turn'] = $newTurn;
                echo "Player: ",$user," do choose ",$data->choose,"\n";
                if($game['player1']>0 && $game['player2']>0){
                    $player = (($user==$game['player1'])?'player2':'player1');
                    $wc = $users[$game[$player]];
                    $que1 = array('name'=>$games[$key]['name'],'tags'=>$games[$key]['tags'],'turn'=>($newTurn),'player1'=>$games[$key]['player1'],'player2'=>$games[$key]['player2'],'board'=>$games[$key]['board']);                
                }
            }
            if($win!==false){
                if($win=='WIN'){
                    $que = 'You WIN!';
                    $que1 = 'You LOSE!';
                } else {
                    $que = $win;
                    $que1 = $win;                  
                }
                print_r($games);
                echo "\n";
                unset($games[$key]);
                print_r($games);
                echo "\n";              
            } else {
                $que = array('name'=>$games[$key]['name'],'tags'=>$games[$key]['tags'],'turn'=>$games[$key]['turn'],'player1'=>$games[$key]['player1'],'player2'=>$games[$key]['player2'],'board'=>$games[$key]['board']);
            }
        }
        if(isset($que1)){
            $ms1 = json_encode($que1);
            $wc->send($ms1); 
        }
        $ms = json_encode($que);
        $webconnection->send($ms);
    }
};

function winGame($board){
    $valWin = [[0,1,2] , [3,4,5] , [6,7,8] , [0,3,6] , [1,4,7] , [2,5,8] , [0,4,8] , [2,4,6]];
    $win = 0;
    foreach ($valWin as $k => $v){
        $g = 0;
        foreach($v as $j => $i){
            if($board[$v[0]]==$board[$i] && $board[$i]>0){
                $g++;
                if($g>2){
                    return 'WIN';
                }
            }
        }
    }
    if(in_array(0,$board)===false){
        return ('Draw!');
    }
    return false;
}

$ws_worker->onConnect = function($connection) use (&$users)
{
    $connection->onWebSocketConnect = function($connection) use (&$users)
    {
        // при подключении нового пользователя сохраняем get-параметр, который же сами и передали со страницы сайта
        $users[$_GET['user']] = $connection;
        echo "User add: ",$_GET['user'],"\n";
    };
};

$ws_worker->onClose = function($connection) use(&$users,&$games){
    // удаляем параметр при отключении пользователя
    $user = array_search($connection, $users);
    unset($users[$user]);
    $k = false;
    while (($k = array_search($user, array_column($games, 'player1')))!==false || ($k=array_search($user, array_column($games, 'player2')))!==false):
        unset($games[$k]);
    endwhile;
    echo "Deleted user: ",$user,"\n";
};
// Run worker
Worker::runAll();