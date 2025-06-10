<?php
include("path.php"); // Путь относительно текущего файла
include("../DataBase/database.php"); // Путь к файлу database.php
$i = (int)$_GET['i'];
// session_start();
$post = [
    'Online'=>0
];
update('users', $_SESSION['user'][$i]['ID'] ,$post);
unset($_SESSION['user'][$i]);
// unset($_SESSION['id']); 
// unset($_SESSION['ID']); 
// unset($_SESSION['name']); 
// unset($_SESSION['mail']); 
// unset($_SESSION['wins']); 
// unset($_SESSION['lose']); 
header('location: '. BASE_URL. "/sign.php");
?>