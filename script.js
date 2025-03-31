document.addEventListener('DOMContentLoaded', function () {
    const formProduto = document.getElementById('formProduto');
    const produtosContainer = document.getElementById('produtos');
    const editForm = document.getElementById('editForm');

    localStorage.removeItem('produtosTemporarios');

    /*
    --------------------------------------------------------------------------------------
    Chamada da função para buscar produtos
    --------------------------------------------------------------------------------------
    */
    function fetchProdutos() {
        fetch('http://localhost:5000/produtos')
            .then(response => response.json())
            .then(produtos => {
                exibirProdutos(produtos, false);
            })
            .catch(() => {
                console.warn('API offline - exibindo produtos temporários');
                exibirProdutos(obterProdutosTemporarios(), true); 
            });
    }

    /*
    --------------------------------------------------------------------------------------
    Chamada da função para exibir produtos na listagem
    --------------------------------------------------------------------------------------
    */ 
    function exibirProdutos(produtos, isTemporario) {
        produtosContainer.innerHTML = '';
        produtos.forEach(produto => {
            let valorFormatado = produto.valor.toFixed(2).replace('.', ',');
            const produtoCard = document.createElement('div');
            produtoCard.classList.add('col-md-4');
            produtoCard.innerHTML = `
                <div class="card">
                    <img src="${produto.imagem}" class="card-img-top" alt="${produto.nome}">
                    <div class="card-body">
                        <h5 class="card-title">${produto.nome}</h5>
                        <p class="card-text">${produto.descricao}</p>
                    </div>
                    <div class="card-footer d-flex justify-content-between">
                        <span>R$ ${valorFormatado}</span>
                        <div>
                            <button class="btn btn-editar btn-sm" onclick="editProduto(${produto.id}, ${isTemporario})">
                                <i class="fas fa-pencil-alt"></i> Editar
                            </button>
                            <button class="btn btn-deletar btn-sm" onclick="deleteProduto(${produto.id}, ${isTemporario})">
                                <i class="fas fa-trash-alt"></i> Deletar
                            </button>
                        </div>
                    </div>
                </div>
            `;
            produtosContainer.appendChild(produtoCard);
        });
    }

    /*
    --------------------------------------------------------------------------------------
    Chamada da função para salvar produto
    --------------------------------------------------------------------------------------
    */ 
    formProduto.addEventListener('submit', function (e) {
        e.preventDefault();

        const imagem = document.getElementById('imagem').value;
        const nome = document.getElementById('nome').value;
        const valor = parseFloat(document.getElementById('valor').value);
        const descricao = document.getElementById('descricao').value;

        if (!imagem || !nome || isNaN(valor) || valor <= 0 || !descricao) {
            alert("Todos os campos são obrigatórios e o valor deve ser um número válido!");
            return;
        }

        const novoProduto = {
            id: Date.now(), 
            imagem,
            nome,
            valor,
            descricao
        };

        fetch('http://localhost:5000/produto', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(novoProduto).toString()
        })
        .then(response => response.json())
        .then(() => {
            alert("Produto cadastrado com sucesso!");
            fetchProdutos();
        })
        .catch(() => {
            console.warn("API offline - salvando produto temporariamente.");
            salvarProdutoTemporario(novoProduto);
            exibirProdutos(obterProdutosTemporarios(), true);
        });

        formProduto.reset();
    });

    function salvarProdutoTemporario(produto) {
        let produtosTemp = obterProdutosTemporarios();
        produtosTemp.push(produto);
        localStorage.setItem('produtosTemporarios', JSON.stringify(produtosTemp));
    }

    function obterProdutosTemporarios() {
        return JSON.parse(localStorage.getItem('produtosTemporarios')) || [];
    }

    /*
    --------------------------------------------------------------------------------------
    Chamada da função para editar produto
    --------------------------------------------------------------------------------------
    */
    window.editProduto = function (id, isTemporario) {
        if (isTemporario) {
            let produtosTemp = obterProdutosTemporarios();
            const produto = produtosTemp.find(p => p.id === id);
            if (produto) {
                document.getElementById('editProdutoId').value = produto.id;
                document.getElementById('editImagem').value = produto.imagem;
                document.getElementById('editNome').value = produto.nome;
                document.getElementById('editValor').value = produto.valor;
                document.getElementById('editDescricao').value = produto.descricao;

                new bootstrap.Modal(document.getElementById('editModal')).show();
            }
        } else {
            fetch(`http://localhost:5000/produto/${id}`)
                .then(response => response.json())
                .then(produto => {
                    if (produto.id) {
                        document.getElementById('editProdutoId').value = produto.id;
                        document.getElementById('editImagem').value = produto.imagem;
                        document.getElementById('editNome').value = produto.nome;
                        document.getElementById('editValor').value = produto.valor;
                        document.getElementById('editDescricao').value = produto.descricao;
                        new bootstrap.Modal(document.getElementById('editModal')).show();
                    }
                })
                .catch(err => alert('Erro ao carregar produto para edição: ' + err));
        }
    }

    /*
    --------------------------------------------------------------------------------------
    Chamada da função para atualizar o produto
    --------------------------------------------------------------------------------------
    */
    editForm.addEventListener('submit', function (e) {
        e.preventDefault(); 

        const id = document.getElementById('editProdutoId').value;
        const imagem = document.getElementById('editImagem').value;
        const nome = document.getElementById('editNome').value;
        const valor = document.getElementById('editValor').value;
        const descricao = document.getElementById('editDescricao').value;

        if (!imagem || !nome || isNaN(valor) || valor <= 0 || !descricao) {
            alert("Todos os campos são obrigatórios e o valor deve ser um número válido!");
            return;
        }

        const formData = new URLSearchParams();
        formData.append("imagem", imagem);
        formData.append("nome", nome);
        formData.append("valor", parseFloat(valor));
        formData.append("descricao", descricao);

        const idProduto = parseInt(id);

        let produtosTemp = obterProdutosTemporarios();
        let produtoIndex = produtosTemp.findIndex(p => p.id === idProduto);

        if (produtoIndex !== -1) {
            produtosTemp[produtoIndex] = {
                id: idProduto,
                imagem,
                nome,
                valor: parseFloat(valor),
                descricao
            };
            localStorage.setItem('produtosTemporarios', JSON.stringify(produtosTemp));

            alert("Produto temporário atualizado com sucesso!");
            const modal = bootstrap.Modal.getInstance(document.getElementById('editModal')); 
            modal.hide();

            exibirProdutos(produtosTemp, true);
        } else {
            fetch(`http://localhost:5000/produto/${idProduto}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: formData.toString()
            })
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => { throw new Error(`Erro ${response.status}: ${text}`); });
                }
                return response.json();
            })
            .then(data => {
                alert("Produto atualizado com sucesso!");

                const modal = bootstrap.Modal.getInstance(document.getElementById('editModal')); 
                modal.hide(); 

                fetchProdutos();
            })
            .catch(err => alert("Erro ao atualizar produto: " + err.message));
        }
    });

    /*
    --------------------------------------------------------------------------------------
    Chamada da função para deletar produto
    --------------------------------------------------------------------------------------
    */   
    window.deleteProduto = function (id, isTemporario) {
        if (isTemporario) {
            let produtosTemp = obterProdutosTemporarios();
            produtosTemp = produtosTemp.filter(p => p.id !== id);
            localStorage.setItem('produtosTemporarios', JSON.stringify(produtosTemp));
            exibirProdutos(produtosTemp, true);
            alert("Produto deletado com sucesso!");
        } else {
            if (confirm('Tem certeza que deseja excluir este produto?')) {
                fetch(`http://localhost:5000/produto/${id}`, {
                    method: 'DELETE',
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.message) {
                            alert(data.message);
                            fetchProdutos();  
                        } else {
                            alert('Erro ao excluir produto.');
                        }
                    })
                    .catch(error => alert('Erro ao excluir produto: ' + error));
            }
        }
    }

    fetchProdutos();
});