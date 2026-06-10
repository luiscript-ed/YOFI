from winotify import Notification

notificacao = Notification(
    app_id="YOFI",
    title="MYA",
    message="Voce têm gastado demais"
)

# Adiciona um botão que abre um link no navegador
notificacao.add_actions(
    label="Abrir app", 
    launch="https://google.com"
)

notificacao.show()
