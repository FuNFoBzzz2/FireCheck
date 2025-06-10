<?php  
    include("control/users.php");
?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="assets//regc.css">
    <title>Register</title>
</head>
<body>
<div class="container">
    <form method = "POST" action ="reg.php">
    <h2>Регистрация</h2>
    <div class="errorT">
        <p><?=$errMsg?></p>
    </div>
    <!-- <form action="#" method="post"> -->
        <div class="form-group">
            <label class="form-label">Имя</label>
            <input id="name" name="name" class="inputT" placeholder="Введите ваше имя" value="<?= htmlspecialchars($name) ?>">
        </div>
        <div class="form-group">
            <label class="form-label">Электронная почта</label>
            <input id="email" name="mail" class="inputT" placeholder="Введите вашу почту" value="<?= htmlspecialchars($mail) ?>" required>
        </div>
        <div class="form-group">
            <label class="form-label">Пароль</label>
            <input id="password" name="pass-first" placeholder="Введите ваш пароль" class="inputT">
        </div>
        <div class="form-group">
            <label class="form-label">Повтор пароля</label>
            <input id="password" name="pass-second" class="inputT" placeholder="Ещё раз введите пароль">
        </div>
        <button type="submit" class="submit-button" name="button-reg">Зарегистрироваться</button>
        <!-- <button  class="submit-button" name="button-sign">Войти</button> -->
        <a href="<?php echo BASE_URL . "/sign.php"; ?>" class="href" >Войти</a>
        <!-- <button class="submit-button" name="button-sign">Войти</button> -->
    <!-- </form> -->
    </form>
</div>

</body>
</html>