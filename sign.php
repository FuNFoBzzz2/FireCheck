<?php  
    include("control/users.php");
?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="assets/regc.css">
    <title>SignIn</title>
</head>
<body>
    
<div class="container">
<form method = "POST" action ="sign.php">
    <h2>Авторизация</h2>
    <div class="errorT">
        <p><?=$errMsg?></p>
    </div>
        <div class="form-group">
            <label class="form-label">Электронная почта</label>
            <input type="email" id="mail" name="mail" class="inputT" placeholder="Введите вашу почту" value="<?= htmlspecialchars($mail)?>" required>
        </div>
        <div class="form-group">
            <label class="form-label">Пароль</label>
            <input type="password" id="password" name="password" class="inputT" placeholder="Введите ваш пароль" required>
        </div>
        <button type="submit" class="submit-button" name="button-sign">Войти</button>
        <a href="<?php echo BASE_URL . "/reg.php"; ?>" class="href" name="button-sign" >Зарегистрироваться</a>
        
        </form>
</div>

</body>
</html>