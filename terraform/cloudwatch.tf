resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ecs/gestion-employe-backend"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "frontend" {
  name              = "/ecs/gestion-employe-frontend"
  retention_in_days = 7
}