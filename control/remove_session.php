<?php
session_start();
include("control/path.php"); 
include("control/users.php");

if (isset($_POST['i'])) {
    $i = (int)$_POST['i'];
    
    // Удаляем данные пользователя из сессии
    if (isset($_SESSION['user'][$i])) {
        unset($_SESSION['user'][$i]);
    }
    
    // Также можно обновить статус пользователя в базе данных
    $post = [
        'Online' => 0
    ];
    update('users', $_SESSION['user'][$i]['ID'], $post);
}
?>