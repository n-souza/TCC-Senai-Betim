<?php
// backend/api/ProcessarLogin.php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/../Classes/Funcionario.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = $_POST['email'];
    $senha = $_POST['senha'];

    $cargo = Funcionario::login($email, $senha);

    if ($cargo) {
        // CORRIGIDO: Força o caminho a partir da raiz da URL usando uma barra inicial "/"
        // ou usando o caminho correto saindo da pasta 'api'
        if ($cargo === 'Gestor') {
    header("Location: /Projeto-TCC-Senai/frontend/dashboard.html");
            exit;
        } elseif ($cargo === 'Colaborador') {
        header("Location: /Projeto-TCC-Senai/frontend/dashboardColaborador.html");
            exit; 
        }
    } else {
        // Se o login falhar, volta para o index.html que está na raiz do projeto
        // Sair de api/ (../) e sair de backend/ (../) -> chega na raiz onde está o index.html
        header("Location: /Projeto-TCC-Senai/index.html?erro=dados_invalidos");
        exit;
    }
} else {
    header("Location: ../../index.html");
    exit;
}