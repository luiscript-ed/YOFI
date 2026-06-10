local Pegasus = require('pegasus')
local server = Pegasus:new({ port = 9090 })
local client = Pegasus:new({ port = 6767 })

server:start(function(req, rep)
    local path = req:path()
    local method = req:method()

    if path == "/enviar-dados" and method == "POST" then
        
        local corpo = req:body()
        
        print("Números recebidos do outro arquivo: " .. corpo)
        rep:status(200)
        rep:write("Dados recebidos com sucesso! começando tratamento")

        // decidir oque vai ser passado aqui, categoria, descrição, valor, gasto/ganho
        
    else
        rep:status(404)
        rep:write("Rota nao encontrada")
    end
end)