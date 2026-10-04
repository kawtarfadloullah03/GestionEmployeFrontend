variable "mongodb_uri" {
  description = "MongoDB Atlas connection string (backend MONGODB_URI)"
  type        = string
  sensitive   = true
}

variable "database_name" {
  description = "MongoDB database name (backend DATABASE_NAME)"
  type        = string
  default     = "GestionEmploye"
}

variable "jwt_secret" {
  description = "JWT secret (backend JWT_SECRET)"
  type        = string
  sensitive   = true
}

variable "openrouter_api_key" {
  description = "OpenRouter API key used by the chatbot"
  type        = string
  sensitive   = true
}

variable "openrouter_model" {
  description = "OpenRouter model id used by the chatbot"
  type        = string
  default     = "qwen/qwen3.8-27b:free"
}
