
# Rifaflow - Sistema Backend 

Este backend foi desenvolvido para gerenciar a venda de rifas, o cadastro de participantes, a geração automática de bilhetes e a integração com o sistema de pagamentos Mercado Pago, utilizando o PIX.

## Tecnologias Utilizadas:

- NodeJS
- NestJS
- Prisma
- Supabase
- JWT para autenticação
- Cron Jobs
- Mercado Pago (PIX)
  
## Funcionalidades

- **Criação de Rifas**: Administradores podem criar novas rifas, definindo descrições de prêmios, preços dos ingressos e o número máximo de ingressos disponíveis.
- **Compra de Ingressos**: Usuários podem comprar ingressos para rifas disponíveis, com a possibilidade de escolher a quantidade de ingressos.
- **Geração Automática de Ingressos**: O sistema gera automaticamente o número de ingressos correspondente à compra realizada.
- **Integração com Mercado Pago (PIX)**: Pagamentos são processados através do Mercado Pago utilizando a opção de pagamento PIX.
- **Validação de Pagamentos**: O sistema valida os pagamentos recebidos e assegura que o processo de compra seja concluído corretamente.
- **Emissão de Tickets**: Após a confirmação do pagamento, os ingressos são emitidos e vinculados ao usuário que realizou a compra.
- **Visualização de Rifas e Participantes**: Administradores podem visualizar todas as rifas ativas e os participantes de cada uma delas.
- **Painel Administrativo**: Interface para gerenciamento de rifas, verificação de status de pagamento e controle dos participantes.

## Authors

- [@lazaroalvesr](https://github.com/lazaroalvesr)


## 🔗 Links
- [Rifaflow](https://raffle-master-front.vercel.app/)
- 
[![portfolio](https://img.shields.io/badge/my_portfolio-000?style=for-the-badge&logo=ko-fi&logoColor=white)](https://www.lazaroalvesr.com/)

[![linkedin](https://img.shields.io/badge/linkedin-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/l%C3%A1zaro-alves-r/)


