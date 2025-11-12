#!/bin/bash

# Criar pasta docs
mkdir -p docs

# Criar README principal
cat > docs/README.md << 'EOF'
# 📚 Documentação YoJornada

Sistema de ranking mensal para jogadores de League of Legends.

## 📖 Índice

- [Arquitetura](./ARCHITECTURE.md)
- [API](./API.md)
- [Setup](./SETUP.md)
- [Desenvolvimento](./DEVELOPMENT.md)
- [Deploy](./DEPLOYMENT.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
EOF

echo "✅ Documentação criada em docs/"