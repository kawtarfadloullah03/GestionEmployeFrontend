resource "google_artifact_registry_repository" "repo" {
  location      = var.region
  repository_id = "gestion-employe"
  description   = "Images Docker du projet gestion employes"
  format        = "DOCKER"
}
