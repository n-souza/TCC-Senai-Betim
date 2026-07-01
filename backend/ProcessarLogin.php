<?php
// backend/ProcessarLogin.php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// CORRIGIDO: Uso do __DIR__ para evitar falhas de rota no servidor
require_once __DIR__ . '/Classes/Funcionario.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = $_POST['email'];
    $senha = $_POST['senha'];

    // Agora o método estático vai rodar sem quebrar o script!
    $cargo = Funcionario::login($email, $senha);

    if ($cargo) {
        if ($cargo === 'Gestor') {
            header("Location: ../frontend/home.html");
        } elseif ($cargo === 'Colaborador') {
            header("Location: ../frontend/homeColaborador.html");
        } elseif ($cargo === 'Admin') {
            header("Location: ../frontend/painel_admin.php");
        }
        exit; 
    } else {
        header("Location: ../index.html?erro=dados_invalidos");
        exit;
    }
} else {
    header("Location: ../index.html");
    exit;
}