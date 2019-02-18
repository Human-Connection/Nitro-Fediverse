Feature: Webfinger discovery
  From an external server, e.g. Mastodon
  I want to search for an actor alias
  In order to follow the actor

  Background:
    Given our own server runs at "http://localhost:4100"
    And we have the following users in our database:
      | Slug         |
      | peter-lustig |

  Scenario: Search
    When I send a GET request to "/.well-known/webfinger?resource=acct:peter-lustig@localhost"
    Then I receive the following json:
    """
    {
      "subject": "acct:peter-lustig@localhost:4100",
      "links": [
        {
          "rel": "self",
          "type": "application/activity+json",
          "href": "https://localhost:4100/users/peter-lustig"
        }
      ]
    }
    """
    And I expect the Content-Type to be:
    """
    application/jrd+json; charset=utf-8
    """

  Scenario: User does not exist
    When I send a GET request to "/.well-known/webfinger?resource=acct:nonexisting@localhost"
    Then I receive the following json:
    """
    {
      "error": "No record found for nonexisting@localhost."
    }
    """
