resource "aws_security_group" "frontend" {
  name        = "gestion-employe-frontend-sg"
  description = "Security group for frontend"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "HTTP"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]

  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "gestion-employe-frontend-sg"
  }
}

resource "aws_security_group" "backend" {
  name        = "gestion-employe-backend-sg"
  description = "Security group for backend"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Backend API from ALB"
    from_port       = 5000
    to_port         = 5000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "gestion-employe-backend-sg"
  }
}