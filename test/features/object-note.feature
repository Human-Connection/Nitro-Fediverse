Feature: Send and receive Notes
  I want to send and receive note's via ActivityPub

  Background:
    Given our own server runs at "http://localhost:4100"
    And we have the following users in our database:
      | Slug         |
      | tekari       |
      | john         |

  Scenario: Send a note to a user inbox and make sure it's added to the inbox
    When I send a POST request with the following activity to "/activitypub/users/john/inbox":
    """
    {
      "@context": "https://www.w3.org/ns/activitystreams",
      "id": "https://aronado.org/activitypub/users/tekari/status/83Js2491k7fdna42312455kad83",
      "type": "Create",
      "actor": "https://aronado.org/users/tekari",
      "object": {
          "id": "https://aronado.org/activitypub/users/tekari/status/asdlk3j3ljkh235asf8",
          "type": "Note",
          "published": "2019-02-07T19:37:55.002Z",
          "attributedTo": "https://aronado.org/activitypub/users/tekari",
          "content": "Hi John, how are you?",
          "to": "https://johnshome.com/activitypub/users/john"
      }
    }
    """
    Then I expect the status code to be 200
    And the activity is added to the users inbox collection
