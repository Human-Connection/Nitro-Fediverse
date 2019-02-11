Feature: Follow a user
  I want to be able to follow a user on another instance

  Background:
    Given our own server runs at "http://localhost:4100"
    And we have the following users in our database:
      | Slug         |
      | peter-lustig |

  Scenario: Send a follow to a user inbox and make sure it's added to the inbox
    When I send an activity to "/users/peter-lustig/inbox"
    """
    {
      '@context': 'https://www.w3.org/ns/activitystreams',
      'id': 'https://aronado.org/83J23549sda1k72fsa4567na42312455kad83',
      'type': 'Follow',
      'actor': 'https://aronado.org/users/tekari',
      'object': 'https://johnshome.com/users/john'
    }
    """
    Then the status code is "200"
    And the activity is added to the users inbox collection
    And the response body looks like:
    """
    {
      '@context': 'https://www.w3.org/ns/activitystreams',
      'id': 'https://johnshome.com/nads2354gsasm73wear9a4567na42314jh45esdgf5kad83',
      'type': 'Accept',
      'actor': 'https://johnshome.com/users/john',
      'object': {
        '@context': 'https://www.w3.org/ns/activitystreams',
        'id': 'https://aronado.org/83J23549sda1k72fsa4567na42312455kad83',
        'type': 'Follow',
        'actor': 'https://aronado.org/users/tekari',
        'object': 'https://johnshome.com/users/john'
      }
    }
    """
