<?php include("control/path.php"); 
    include("control/users.php");
    if(isset($_GET['i'])){
        $i = (int)$_GET['i'];
        //$_SESSION['user'][$i]['party']=0;
    }
    //delete_invite($i);
?>  
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Refresh" content="2">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="assets/style.css">
    <title>Profile</title>
    <script>
        window.addEventListener('beforeunload', function (event) {
            navigator.sendBeacon('remove_session.php');
        });
    </script>
</head>
<body>
    <div class="centr-form">
        <form method = "POST" action ="">
            <input type="hidden" name="id_index" value="<?php echo $i; ?>">
            <?php if(!empty($_SESSION['user'][$i]['invite'])): ?>
                <div class="invite-container">
                    <?php foreach($_SESSION['user'][$i]['invite'] as $f => $val): ?>
                        <div class="invite_link">
                            <div class="invite_image"></div>
                            <div class="invite_form">
                                <div class="form-group">
                                    <label for="name" class="form-label">Имя  </label>
                                    <span id="TextName" class="form-value"><?php echo htmlspecialchars($_SESSION['user'][$val[0]]['name']); ?></span>
                                </div>
                                <?php if($_SESSION['user'][$val[0]]['LightMail']==1): ?>
                                    <div class="form-group">
                                        <label for="email" class="form-label">Электронная почта  </label>
                                        <span id="TextEmail" class="form-value"><?php echo htmlspecialchars($_SESSION['user'][$val[0]]['mail']); ?></span>
                                    </div>
                                <?php endif ?>
                                <div class="form-group">
                                    <label for="W/L" class="form-label">Побед / Поражений  </label>
                                    <spa id="TextWL" class="form-value"><?php echo(htmlspecialchars($_SESSION['user'][$val[0]]['wins'])." / ". htmlspecialchars($_SESSION['user'][$val[0]]['lose'])); ?></span>
                                </div>
                            </div>
                        <a href="<?php echo BASE_URL . "/party.php" . '?i=' . $i . '&t=' . $val[0] . '&g=' . $val[1]; ?>" class="href" >Принять</a>
                        <input type="hidden" name="invite_index" value="<?php echo $val[0]; ?>">
                        <button name="button_delinvite" type="submit" class="href">Отклонить</button>
                        </div>
                    <?php endforeach ?>
                </div>
            <?php endif ?>
        </form>
    <div class="container">
        <div class="header">
            <div class="setting">
            <a href="<?php echo BASE_URL . "/alinement.php" . '?i=' . $i; ?>" class="href" >Настройки</a>
                <!-- <button class="settings-button">Настройки</button> -->
                <!-- <button class="settings-button">Выход</button> -->
                <a href="<?php echo BASE_URL . "/control/logout.php" . '?i=' . $i; ?>" class="href" >Выход</a>
            </div>
                <div class="Image"></div>
                <?php if (isset($_SESSION['user'][$i]['ID'])): ?>
            <div class="form-group">
                <label for="name" class="form-label">Имя</label>
                <span id="TextName" class="form-value"><?php echo $_SESSION['user'][$i]['name']; ?></span>
            </div>
            <div class="form-group">
                <label for="email" class="form-label">Электронная почта</label>
                <span id="TextEmail" class="form-value"><?php echo $_SESSION['user'][$i]['mail']; ?></span>
            </div>
            <div class="form-group">
                <label for="W/L" class="form-label">Побед / Поражений</label>
                <span id="TextWL" class="form-value"><?php echo($_SESSION['user'][$i]['wins']." / ". $_SESSION['user'][$i]['lose']); ?></span>
            </div>
            <?php endif; ?>
        </div>
        <div class="buttoncl">
            <a href="<?php echo BASE_URL . "/listpip.php" . '?i=' . $i; ?>" class="settings-button" >Выбрать игрока</a>
            <a href="<?php echo BASE_URL . "/ofline.php" . '?i=' . $i; ?>" class="settings-button" >Играть Offline</a>
            <a href="<?php echo BASE_URL . "/rules.php" . '?i=' . $i; ?>" class="settings-button" >Прочесть правила</a>
        </div>
    </div>
</div>
</body>
</html>