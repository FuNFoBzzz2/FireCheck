<?php
include_once 'DataBase/database.php';
include("path.php"); 
include_once 'users.php';
//  header('Content-Type: application/json');
    $i = (int)$_GET['i'];
    $t = (int)$_GET['t'];
    $arr=[];
    if (isset($_GET['arr'])){
        $arr = $_GET['arr'];
    }
    if (isset($_GET['g'])){
        $color1 = $_GET['g'];
        if($color1=='black'){
            $color2='white';
        }else{
            $color2='black';
        }
        asr($arr, $i, $t);
        header("Location: " . BASE_URL . "/party.php" . '?i=' . $i . '&t=' . $t .'&g=' . $color1);
    } elseif(isset($_GET['y']) && $_GET['y']==3){
        if(isset($_GET['a'])){
            asr($arr, $i, $t);
            header("Location: " . BASE_URL . "/party.php" . '?i=' . $i . '&t=' . $t .'&y=' . 3 . '&a=' . $color1);
        }
        
    }
    function asr($arr, $i, $t){
        if(!empty($_SESSION['game_array'])){
            foreach($_SESSION['game_array'] as $key => $value) {
                if($_SESSION['game_array'][$value[0]]==$i){
                    $_SESSION['game_array'][$value[1]]=$arr;
                } elseif($_SESSION['game_array'][$value[0]]==$t){
                    $_SESSION['game_array'][$value[1]]=$arr;
                }
            }
        }else{
            array_push($_SESSION['game_array'], [$i, $arr]);
            array_push($_SESSION['game_array'], [$t, $arr]);
        }
    }

?>
