package com.chorechamp.sdk

import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse

sealed interface ChoreChampAuth {
    data class ApiKey(val value: String) : ChoreChampAuth
    data class AccessToken(val value: String) : ChoreChampAuth
}

class ChoreChampSdk(
    private val auth: ChoreChampAuth,
    private val baseUrl: String = "https://chorechamp-api-u0o9.onrender.com/api/public/v1"
) {
    private val client = HttpClient.newHttpClient()

    private fun request(path: String, method: String = "GET", body: String? = null): String {
        val builder = HttpRequest.newBuilder()
            .uri(URI.create("$baseUrl$path"))
            .header("Content-Type", "application/json")

        when (val authValue = auth) {
            is ChoreChampAuth.ApiKey -> builder.header("X-API-Key", authValue.value)
            is ChoreChampAuth.AccessToken -> builder.header("Authorization", "Bearer ${authValue.value}")
        }

        val request = if (method == "POST") {
            builder.POST(HttpRequest.BodyPublishers.ofString(body ?: "{}")).build()
        } else {
            builder.GET().build()
        }

        val response = client.send(request, HttpResponse.BodyHandlers.ofString())
        if (response.statusCode() !in 200..299) {
            throw IllegalStateException("Request failed: ${response.statusCode()} ${response.body()}")
        }

        return response.body()
    }

    fun getOpenApi(): String = request("/openapi.json")

    fun listHouseholdChores(householdId: String): String = request("/households/$householdId/chores")

    fun listHouseholdMembers(householdId: String): String = request("/households/$householdId/members")

    fun emitEvent(householdId: String, eventType: String, payloadJson: String): String {
        return request("/households/$householdId/events/$eventType", method = "POST", body = payloadJson)
    }
}
