variable "project_id" {
  description = "ID du projet GCP"
  type        = string
  default     = "gestion-employe-gcp"
}

variable "region" {
  description = "Region GCP (Paris)"
  type        = string
  default     = "europe-west9"
}

variable "github_repository" {
  description = "Repo GitHub autorise pour le deploy (format owner/name)"
  type        = string
  default     = "kawtarfadloullah03/GestionEmployeFrontend"
}
