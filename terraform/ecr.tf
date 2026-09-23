resource "aws_ecr_repository" "backend" {
  name                 = "gestion-employe-backend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name = "gestion-employe-backend"
  }
}

resource "aws_ecr_repository" "frontend" {
  name                 = "gestion-employe-frontend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name = "gestion-employe-frontend"
  }
}