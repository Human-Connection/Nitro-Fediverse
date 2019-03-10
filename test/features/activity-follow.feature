Feature: Follow a user
  I want to be able to follow a user on another instance.
  Also if I do not want to follow a previous followed user anymore,
  I want to undo the follow.

  Background:
    Given our own server runs at "http://localhost:4100"
    And we have the following users in our database:
      | Slug          |
      | karl-heinz    |
      | peter-lustiger|

  Scenario: Send a follow to a user inbox and make sure it's added to the right followers collection
    When I send a POST request with the following activity to "/users/karl-heinz/inbox":
    """
    {
      "@context": "https://www.w3.org/ns/activitystreams",
      "id": "https://localhost:4100/users/karl-heinz/status/83J23549sda1k72fsa4567na42312455kad83",
      "type": "Follow",
      "actor": "https://localhost:4100/users/peter-lustiger",
      "object": "http://localhost:4100/users/karl-heinz"
    }
    """
    Then I expect the status code to be 200
    And the follower is added to the followers collection
    """
    https://localhost:4100/users/peter-lustiger
    """

  Scenario: Send an undo activity to revert the previous follow activity
    When I send a POST request with the following activity to "/users/karl-heinz/inbox":
    """
    {
      "@context": "https://www.w3.org/ns/activitystreams",
      "id": "https://localhost:4100/users/karl-heinz/status/a4DJ2afdg323v32641vna42lkj685kasd2",
      "type": "Undo",
      "actor": "http://localhost:4100/users/peter-lustiger",
      "object": {
        "id": "https://localhost:4100/users/karl-heinz/status/83J23549sda1k72fsa4567na42312455kad83",
        "type": "Follow",
        "actor": "http://localhost:4100/users/peter-lustiger",
        "object": "http://localhost:4100/users/karl-heinz"
      }
    }
    """
    Then I expect the status code to be 200
    And the follower is removed from the followers collection
    """
    https://localhost:4100/users/peter-lustiger
    """
