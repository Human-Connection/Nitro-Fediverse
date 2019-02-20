Feature: Receiving collections
  As a member of the Fediverse I want to be able of fetching collections

  Background:
    Given our own server runs at "http://localhost:4100"
    And we have the following users in our database:
      | Slug            |
      | renate-oberdorf |

  Scenario: Send a request to the outbox URI of renate-oberdorf
    When I send a GET request to "/users/renate-oberdorf/outbox"
    Then I expect the status code to be 200
    And I receive the following json:
    """
    {
      "@context": "https://www.w3.org/ns/activitystreams",
      "id": "https://localhost:4100/users/renate-oberdorf/outbox",
      "summary": "renate-oberdorfs outbox collection",
      "type": "OrderedCollection",
      "first": "https://localhost:4100/users/renate-oberdorf/outbox?page=true",
      "totalItems": 0
    }
    """

  Scenario: Send a request to the following URI of renate-oberdorf
    When I send a GET request to "/users/renate-oberdorf/following"
    Then I expect the status code to be 200
    And I receive the following json:
    """
    {
      "@context": "https://www.w3.org/ns/activitystreams",
      "id": "https://localhost:4100/users/renate-oberdorf/following",
      "summary": "renate-oberdorfs following collection",
      "type": "OrderedCollection",
      "first": "https://localhost:4100/users/renate-oberdorf/following?page=true",
      "totalItems": 0
    }
    """

  Scenario: Send a request to the followers URI of renate-oberdorf
    When I send a GET request to "/users/renate-oberdorf/followers"
    Then I expect the status code to be 200
    And I receive the following json:
    """
    {
      "@context": "https://www.w3.org/ns/activitystreams",
      "id": "https://localhost:4100/users/renate-oberdorf/followers",
      "summary": "renate-oberdorfs followers collection",
      "type": "OrderedCollection",
      "first": "https://localhost:4100/users/renate-oberdorf/followers?page=true",
      "totalItems": 0
    }
    """
