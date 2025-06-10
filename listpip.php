<?php include("control/path.php"); 
    include("control/users.php");
    // $users = selectAll('users'); 
    $i = (int)$_GET['i'];
    if(isset($_GET['t'])){
        $t = (int)$_GET['t'];
        delete_invite($i, $t);
        delete_invite($t, $i);
    }
    $par=0;
    
    $_SESSION['user'][$i]['party']=0;
    // foreach ($users as $user): 
    //     if($user['ID']!==$_SESSION['user'][$i]['ID'] && $user['Online']==1): 
?>  

<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Refresh" content="10">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="assets//lisc.css">
    <title>Players</title>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="setting">
                <a href="<?php echo BASE_URL . '?i=' . $i; ?>" class="href" >Назад</a>
            </div>
            <?php foreach ($_SESSION['user'] as $q => $player): ?>
                
                <?php if(isset($q) && $player['ID']!==$_SESSION['user'][$i]['ID'] && $player['Online']==1): ?>
                    <?php $par=1; ?>
                    <a href="<?php echo BASE_URL . "/party.php" . '?i=' . $i . '&t=' . $q .'&y=' . 1; ?>" class="link" >
                        <div class="list-group">
                            <div class="Image"></div>
                            <?php if($player['Online']==1): ?> 
                                <div class="greenfn"></div>
                            <?php endif ?>
                            <div class="left-form">
                                <div class="form-group">
                                    <label for="name" class="form-label">Имя  </label>
                                    <span id="TextName" class="form-value"><?php echo htmlspecialchars($player['name']); ?></span>
                                </div>
                                <?php if($player['LightMail']==1): ?>
                                    <div class="form-group">
                                        <label for="email" class="form-label">Электронная почта  </label>
                                        <span id="TextEmail" class="form-value"><?php echo htmlspecialchars($player['mail']); ?></span>
                                    </div>
                                <?php endif ?>
                                <div class="form-group">
                                    <label for="W/L" class="form-label">Побед / Поражений  </label>
                                    <spa id="TextWL" class="form-value"><?php echo(htmlspecialchars($player['wins'])." / ". htmlspecialchars($player['lose'])); ?></span>
                                </div>
                                
                            </div>
                            
                            
                        </div>
                    </a>
                <?php endif ?>
            <?php endforeach; ?>
            <?php if ($par==0):?>
                <label class="form-label">Пользователей онлайн нету  </label>
            <?php endif ?>
        </div>
    </div>
</body>
</html>
