# ioco

ioco is a content manager with built-in access control (per application basis).

Basically you can use ioco for pretty anything that needs to deal with some kind
of content management. We at TASTENWERK write project management tools, calendaring
tools, ticket-managemnt tools and many other things on the basis of ioco.

# LICENSE

ioco is licensed under the GPLv3 license

http://opensource.org/licenses/GPL-3.0

# Content Repository

ioco is a almost fully featured content repository.

* hierarchical data organisation through labels
* access control per object basis
* revision control

## Labels and Hierarchy

Labels are used to organise content. Any content can be labeled with other content
and can become a label for another content.

A label structure looks like this:

    labels = [ 'contentAID', 'contentBID', ... ]

## Access Control

There are 2 types of access control.

1. Per Model access (if the model itself has an acl entry for the user or group)
2. Per content (instance) access like in a filesystem

### Examples:

Grant access to WebPage model

    WebPage.access.grant( <user|group>, 'rwscd' )

Grant access to a label (and all content labeled with that label)

  label.access.grant( <user|group>, 'rwscd' )

Privileges are

* read
* write
* share
* create
* delete

### Share

share for a model means, this user can invite other users to collaborate at
model scope (seeing all WebPages) and limit their access again with 'rwscd'

share for a content object means, this user can share this (and only this very)
content object with other users. If the user has the 'can invite new users' switch
set, they can also share this content with entirely new users by providing their
email address.

A new user (invited the way described above) will only see this very content
and nothing else but will be provided with the ioco browser mask.

### Create

create for a model means, this user can create new content instances of this
model (and can see the model as a filter in the search).

create for a content instance means, this user can create content underneath
this content, e.g. an event underneath a calendar content object. Otherwise,
the user may be able to change the calendar object (due to their write privileges)
but not create new objects. But the user could still be able to create this
kind of content because they got create access for the calendar model (see above).

## Version Control

Any content is automatically under version control. Content can be tracked back
for 30 days by default (this can be changed in the config/settings.json file).

## Running tests

please note, that for the convenience of the project's main purpose, this library
has been tested with the (actually optional) mongodb adapter, which you can find
at http://github.com/tastenwerk/ioco-adapter-mongodb
The dummy-adapter only provides methods for the utmost primitive tests.