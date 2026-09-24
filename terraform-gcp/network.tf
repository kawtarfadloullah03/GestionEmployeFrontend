resource "google_compute_network" "vpc" {
  name                    = "gestion-employe-vpc"
  auto_create_subnetworks = false
  routing_mode            = "REGIONAL"
}

resource "google_compute_subnetwork" "public" {
  name          = "gestion-employe-subnet"
  region        = var.region
  network       = google_compute_network.vpc.id
  ip_cidr_range = "10.0.1.0/24"
}
