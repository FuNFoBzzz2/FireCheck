<?php include("control/path.php"); 
    include_once 'control/users.php';
    include("control/checkstate.php");
    $i = (int)$_GET['i'];
    $t = (int)$_GET['t'];
    $nt=0;
    $arr=[];
    if(!empty($_SESSION['game_array'])){
        foreach($_SESSION['game_array'] as $keyd=>$valued){
            if($valued[0]==$i){
                $arr = $valued[1];
            }
        }
    }
    if (isset($_GET['arr'])){
        $arr = $_GET['arr'];
    }
    if (isset($_GET['g'])){
        $g = $_GET['g'];
        delete_invite($t, $i);
        $nt=1;
        if($g=='black'){
            $color2='white';
        }else{
            $color2='black';
        }
        $color1=$g;
    } elseif(isset($_GET['y']) && $_GET['y']==1){
        if(!isset($_GET['a'])){
            $color = rand(0,1);
            if($color==0){
                $color1='white';
                $color2='black';
            }else {
                $color1='black';
                $color2='white';
            }
            invite_push($t, $i, $color2);
            header("Location: " . BASE_URL . "/party.php" . '?i=' . $i . '&t=' . $t .'&y=' . 2 . '&a=' . $color1);
        } else{
            $color1=$_GET['a'];
            if($color1=='black'){
                $color2='white';
            }else{
                $color2='black';
            }
        }
    }
    else if(isset($_GET['y']) && $_GET['y']==2 && isset($_GET['a'])){
        $color1= $_GET['a'];
        if($color1=='black'){
            $color2='white';
        }else{
            $color2='black';
        }
    }
    $Err=0;
    $_SESSION['user'][$i]['party']=$t;
?>  
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Refresh" content="10">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="assets/room.css">
    <title>Room</title>
    <script>
        const userArray = <?php echo json_encode($arr); ?>; 
    </script>
</head>
<body>
    <div class="centr-form">
    <input type="hidden" name="put_user" value="<?php echo json_encode($_SESSION['user'][$i]); ?>">
    <input type="hidden" name="get_user" value="<?php echo json_encode($_SESSION['user'][$t]); ?>">
        <?php if(isset($_SESSION['user'][$t]['party']) && $_SESSION['user'][$t]['party']==$i): ?>
            <div class="link">
                
                <div class="Image"></div>
                <div class="greenfn"></div>
                <div class="left-form">
                    <div class="form-group">
                        <label for="name" class="form-label">Имя  </label>
                        <span id="TextName" class="form-value"><?php echo htmlspecialchars($_SESSION['user'][$t]['name']); ?></span>
                    </div>
                    <?php if($_SESSION['user'][$t]['LightMail']==1): ?>
                        <div class="form-group">
                            <label for="email" class="form-label">Электронная почта  </label>
                            <span id="TextEmail" class="form-value"><?php echo htmlspecialchars($_SESSION['user'][$t]['mail']); ?></span>
                        </div>
                    <?php endif ?>
                    <div class="form-group">
                        <label for="W/L" class="form-label">Побед / Поражений  </label>
                        <spa id="TextWL" class="form-value"><?php echo(htmlspecialchars($_SESSION['user'][$t]['wins'])." / ". htmlspecialchars($_SESSION['user'][$t]['lose'])); ?></span>
                    </div>
                </div>
            </div>
        <?php else: ?>
            <span id="TextInvite" class="form-value"><?php echo ("Ожидание игрока " . htmlspecialchars($_SESSION['user'][$t]['name']) . "...") ?></span>
        <?php endif ?>
        <div class="container">
            <div class="header">
                <div class="setting">
                    <a href="<?php echo BASE_URL . "/listpip.php" . '?i=' . $i . '&t=' . $t; ?>" class="href" >Назад</a>
                </div>
            </div>
            <?php if(isset($_SESSION['user'][$t]) && $_SESSION['user'][$t]['party']==$i): ?>
                <div class="board" id="board"></div>
                <input type="hidden" name="hidden_color" value="<?php echo $color1; ?>">
                <?php if(isset($g)):?>
                    <input type="hidden" name="code_party_g" value="<?php echo $g; ?>">
                <?php elseif(isset($y)): ?>
                    <input type="hidden" name="code_party_y" value="<?php echo $y; ?>">
                <?php endif ?>
                <input type="hidden" name="id_user" value="<?php echo $i; ?>">
                <input type="hidden" name="index_friend" value="<?php echo $t; ?>">
                <script src="assets/scripton.js"></script>
            <?php endif ?>
            <?php if(!isset($_SESSION['user'][$t]) || 
            ($_SESSION['user'][$t]['party'] !==$i && 
            $_SESSION['user'][$t]['party']!==0) || 
            ($_SESSION['user'][$t]['party']==0 && 
            invite_Check($t, $i)==12)): ?>
                <?php echo ("Игрок " . htmlspecialchars($_SESSION['user'][$t]['name']) . " Не подключился") ?>
            <?php endif ?>
        </div>
        <div class="link">
            <div class="Image"></div>
            <div class="greenfn"></div>
            <div class="left-form">
                <div class="form-group">
                    <label for="name" class="form-label">Имя  </label>
                    <span id="TextName" class="form-value"><?php echo htmlspecialchars($_SESSION['user'][$i]['name']); ?></span>
                </div>
                <?php if($_SESSION['user'][$i]['LightMail']==1): ?>
                    <div class="form-group">
                        <label for="email" class="form-label">Электронная почта  </label>
                        <span id="TextEmail" class="form-value"><?php echo htmlspecialchars($_SESSION['user'][$i]['mail']); ?></span>
                    </div>
                <?php endif ?>
                <div class="form-group">
                    <label for="W/L" class="form-label">Побед / Поражений  </label>
                    <spa id="TextWL" class="form-value"><?php echo(htmlspecialchars($_SESSION['user'][$i]['wins'])." / ". htmlspecialchars($_SESSION['user'][$i]['lose'])); ?></span>
                </div>
            </div>
        </div>
    </div>
</body>
</html>