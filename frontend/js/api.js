// COMUNICAÇÃO COM O BACKEND (PHP)
const API = {
    async buscarItens() {
        try {
            const response = await fetch('../backend/api/buscarItens.php');
            const dados = await response.json();
            if (dados.sucesso) return dados;
            throw new Error(dados.erro || "Erro desconhecido");
        } catch (erro) {
            console.error("Erro na requisição (buscar):", erro);
            alert("Erro ao carregar os dados do servidor.");
            return null;
        }
    },

    async arquivarItem(idDoItem) {
        if (!confirm("Tem certeza que deseja arquivar este item? Ele sairá da lista de ativos.")) return false;

        try {
            const response = await fetch('../backend/api/arquivarItens.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: idDoItem })
            });
            const resultado = await response.json();
            
            if (resultado.sucesso) {
                alert("Item arquivado com sucesso!");
                return true;
            }
            alert("Erro ao arquivar: " + resultado.erro);
            return false;
        } catch (erro) {
            console.error("Erro na requisição (arquivar):", erro);
            return false;
        }
    }
};