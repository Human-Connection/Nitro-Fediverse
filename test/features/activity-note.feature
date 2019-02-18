Feature: Send and receive Notes
  I want to send and receive note's via ActivityPub

  Background:
    Given our own server runs at "http://localhost:4100"
    And we have the following users in our database:
      | Slug         |
      | peter-lustig |

  Scenario: Send a note to a user inbox and make sure it's added to the inbox
    When I send an activity to "/users/peter-lustig/inbox"
    """
    {
      "@context": "https://www.w3.org/ns/activitystreams",
      "id": "https://aronado.org/83Js2491k7fdna42312455kad83",
      "type": "Create",
      "actor": "https://aronado.org/users/tekari",
      "object": {
          "id": "https://aronado.org/asdlk3j3ljkh235asf8",
          "type": "Note",
          "published": "2019-02-07T19:37:55.002Z",
          "attributedTo": "https://aronado.org/users/tekari",
          "content": "Hi John, how are you?",
          "to": "https://johnshome.com/users/john"
      }
    }
    """
    Then the status code is 200
    And the activity is added to the users inbox collection
