Feature: Follow a user
  I want to be able to follow a user on another instance

  Background:
    Given our own server runs at "http://localhost:4100"
    And we have the following users in our database:
      | Slug          |
      | karl-heinz    |
      | peter-lustiger|

  Scenario: Send a follow to a user inbox and make sure it's added to the right followers collection
    When I send an activity to "/users/karl-heinz/inbox"
    """
    {
      "@context": "https://www.w3.org/ns/activitystreams",
      "id": "https://localhost:4100/users/karl-heinz/status/83J23549sda1k72fsa4567na42312455kad83",
      "type": "Follow",
      "actor": "http://localhost:4100/users/peter-lustiger",
      "object": "http://localhost:4100/users/karl-heinz"
    }
    """
    Then the status code is 200
    And the follower is added to the followers collection
    """
    http://localhost:4100/users/peter-lustiger
    """
