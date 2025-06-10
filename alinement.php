<?php include("control/path.php"); 
    include("control/users.php");
    $i = (int)$_GET['i'];
?>  
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="assets/style.css">
    <title>Profile</title>
</head>
<body>
    <div class="container">
        <form method = "POST" action ="alinement.php">
        <div class="header">
            <div class="setting">
                <a href="<?php echo BASE_URL . '?i=' . $i; ?>" class="href" >Выйти в профиль</a>
            </div>
            <div class="Image"></div>
            <?php if (isset($_SESSION['user'][$i]['ID'])): ?>
            <div class="left-form">
                <div class="form-group">
                    <label for="name" class="form-label">Имя</label>
                    <input type="name" id="TextName" name="name" class="inputT" required value="<?php echo $_SESSION['user'][$i]['name']; ?>">
                </div>
                <div class="form-group">
                    <label for="mail" class="form-label">Электронная почта</label>
                    <input type="email" id="TextEmail" name="mail" class="inputT" required value="<?php echo $_SESSION['user'][$i]['mail']; ?>">
                </div>
                <div class="form-group">
                    <label for="password" class="form-label">Старый пароль</label>
                    <input type="password" id="TextPassword" name="password" class="inputT">
                </div>
                <div class="form-group">
                    <label for="pass-first" class="form-label">Новый пароль</label>
                    <input type="pass-first" id="pass-first" name="pass-first" class="inputT">
                </div>
                <div class="form-group">
                    <label for="pass-second" class="form-label">Подтверждение пароля</label>
                    <input type="pass-second" id="pass-second" name="pass-second" class="inputT">
                </div>
                <div class="form-group">
                    <label for="mailVisible" class="form-label">Видимость почты</label>
                    <input type="checkbox" id="mailVisible" name="mailVisible" class="checkin" value="1" <?php echo ($_SESSION['user'][$i]['LightMail'] == 1) ? 'checked' : ''; ?>>
                </div>
                <div class="errorT">
                    <p><?=$errMsg?></p>
                </div>
            </div>
            
            <?php endif; ?>
        </div>
        <div class="buttoncl">
            <button type="submit" class="settings-button" name="button-save">Сохранить</button>
            <button type="submit" class="settings-button" name="button-del">Удалить</button>
        </div>
    </div>
    <input type="hidden" name="user_index" value="<?php echo $i; ?>"> <!-- Скрытое поле для передачи $i -->
</body>
</html>