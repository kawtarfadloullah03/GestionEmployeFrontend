output "backend_url" {
  description = "URL publique du backend Cloud Run"
  value       = google_cloud_run_v2_service.backend.uri
}

output "frontend_url" {
  description = "URL publique du frontend Cloud Run"
  value       = google_cloud_run_v2_service.frontend.uri
}

output "artifact_registry_repo" {
  description = "Repo Artifact Registry (europe-west9-docker.pkg.dev/PROJECT/REPO)"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.repo.repository_id}"
}

output "github_deployer_sa" {
  description = "Compte de service GitHub pour WIF"
  value       = google_service_account.github_deployer.email
}

output "wif_provider" {
  description = "Workload Identity Provider (a mettre dans les secrets GitHub)"
  value       = "projects/${data.google_project.current.number}/locations/global/workloadIdentityPools/${google_iam_workload_identity_pool.github.workload_identity_pool_id}/providers/${google_iam_workload_identity_pool_provider.github.workload_identity_pool_provider_id}"
}

data "google_project" "current" {
  project_id = var.project_id
}
