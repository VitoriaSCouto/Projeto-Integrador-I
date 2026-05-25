import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.deficiencia.createMany({
    data: [
      { nome: "Física" },
      { nome: "Visual" },
      { nome: "Auditiva" },
      { nome: "Intelectual" },
      { nome: "TEA" },
      { nome: "Múltipla" },
      { nome: "Psicossocial" },
      { nome: "Surdocegueira" },
      { nome: "Nanismo" },
      { nome: "Paralisia Cerebral" },
      { nome: "Mobilidade Reduzida" },
      { nome: "Deficiência de Fala" },
      { nome: "Transtorno de Aprendizagem" },
      { nome: "Síndrome de Down" },
      { nome: "Epilepsia" }
    ]
  })

  console.log("Deficiências cadastradas!")
}

main()
  .catch((e) => {
    console.error(e)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })