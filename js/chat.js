/* ===========================================================================
 jQuery Document Ready
 ============================================================================== */

jQuery(document).ready(function() {
    Chatoo.init();
});

Chatoo = {
    chatboxFocus: [],
    newMessages: [],
    chatBoxes: [],
    maxSentences: sentences.length,
    /************************************************
     Init the functions and some stuff
     ************************************************/
    init: function() {

        Chatoo.getTheListFriends();

        /**
         * Clicking the title of list friend, will close the list and show
         * how many friends are online.
         */
        $('#ChatFriendsContainer h3').on('click', function() {
            let intUsersOnline = 0;
            $.each(usersList, function() {
                if (this.status === 1) {
                    intUsersOnline++;
                }
            });
            $('.WrappelistFriends').slideToggle('slow', function() {
                const $usersOnline = $('.usersOnline');
                $usersOnline.empty().fadeIn().text('(' + intUsersOnline + ' Online)');
                if ($('.WrappelistFriends').css('display') === 'block') {
                    $usersOnline.fadeOut().empty();
                }
            });
        });

    },
    /**
     * Function to add a friend on the list (array)
     * @param user
     * @param urlAvatar
     */
    addFriends: function(user, urlAvatar) {
        usersList.push({username: user.toLowerCase().replace(/\s+/g, ''), name: user, avatar: !urlAvatar ? 'images/avatar.png' : urlAvatar, status: 0});
        console.log('[Friend Added] friends available = ' + usersList.length);
        let lastUser = usersList.length - 1;
        console.log('last Added : ' + usersList[lastUser].name);
        Chatoo.refreshFriendsList();
    },
    /**
     * Function to refresh the friends list with order
     */
    refreshFriendsList: function() {
        $('.listFriends').empty();
        usersList.sort(function(a, b) {
            return b.status - a.status;
        });
        $.each(usersList, function() {
            $('.listFriends').append('<li class="status-' + this.status + '" data-username="' + this.name + '"><img alt="' + this.avatar + '" src="' + this.avatar + '" />' + this.name + '<i></i></li>');
        });

        // Open chatbox
        $('.listFriends li').on('click', function() {
            Chatoo.createChatBox($(this).data('username'), 0);
        });
    },
    /**
     * Call refreshFriendsList();
     * @returns the list of friends
     */
    getTheListFriends: function() {
        Chatoo.refreshFriendsList();
    },
    /**
     * Update the user status (online/offline)
     * @param user
     * @param newStatus
     */
    updateStatus: function(user, newStatus) {
        $.each(usersList, function() {
            if (this.name === user) {
                this.status = newStatus;
                Chatoo.refreshFriendsList();
                console.log('Status updated to [' + (newStatus === 0 ? 'Offline' : 'Online') + ']')
            }
        });
    },
    /**
     * Create chatbox to start chating
     * @param chatboxtitle
     */
    createChatBox: function(chatboxtitle) {
        var chatboxUser = chatboxtitle.toLowerCase().replace(/\s+/g, '');

        if ($('#chatbox_' + chatboxUser).length > 0) {
            if ($('#chatbox_' + chatboxUser).css('display') === 'none') {
                $('#chatbox_' + chatboxUser).css('display', 'block');
            }
            $('#chatbox_' + chatboxUser + ' .chatboxtextarea').focus();
            return;
        }
        $(' <div />').attr('id', 'chatbox_' + chatboxUser)
            .addClass('chatbox clearfix')
            .html('<div class="chatboxhead"><div class="chatboxtitle">' + chatboxtitle + '</div><div class="chatboxoptions"><a href="javascript:void(0)" onclick="Chatoo.closeChatBox(\'' + chatboxUser + '\')">X</a></div><br /></div><div class="chatboxcontent"></div><div class="chatboxinput"><textarea class="chatboxtextarea" onkeydown="Chatoo.checkChatBoxInputKey(this,\'' + chatboxUser + '\');"></textarea></div>')
            .appendTo($('body'));
        $('#chatbox_' + chatboxUser + ' .chatboxtextarea').focus();

        // Initiate Draggable and resizable
        $('#chatbox_' + chatboxUser)
            .draggable({
                drag: function() {
                    $(this).css('z-index', 1);
                },
                stop: function() {
                    $('#chatbox_' + chatboxUser + ' .chatboxtextarea').focus();
                }
            })
            .resizable({
                start: function() {
                    $(this).css('z-index', 1);
                },
                stop: function() {
                    $('#chatbox_' + chatboxUser + ' .chatboxtextarea').focus();

                },
                minHeight: 319,
                minWidth: 225,
                alsoResize: '#chatbox_' + chatboxUser + ' .chatboxtextarea, #chatbox_' + chatboxUser + ' .chatboxcontent'
            });

        chatBoxeslength = 0;
        for (let x in Chatoo.chatBoxes) {
            if ($('#chatbox_' + Chatoo.chatBoxes[x]).css('display') !== 'none') {
                chatBoxeslength++;
            }
        }

        if (chatBoxeslength > 0) {
            width = (chatBoxeslength) * (225 + 7) + 10;
            $('#chatbox_' + chatboxUser).css('left', width + 'px');
        }

        Chatoo.chatBoxes.push(chatboxUser);

        Chatoo.chatboxFocus[chatboxUser] = false;
        $('#chatbox_' + chatboxUser + ' .chatboxtextarea').blur(function() {
            Chatoo.chatboxFocus[chatboxUser] = false;
            $(this).removeClass('chatboxtextareaselected');
            $('#chatbox_' + chatboxUser).css('z-index', 0);
        }).focus(function() {
            Chatoo.chatboxFocus[chatboxUser] = true;
            Chatoo.newMessages[chatboxUser] = false;
            $('#chatbox_' + chatboxUser + ' .chatboxhead').removeClass('chatboxblink');
            $(this).addClass('chatboxtextareaselected');
        });

        $('#chatbox_' + chatboxUser).click(function() {
            $('#chatbox_' + chatboxUser + ' .chatboxtextarea').focus();
            $(this).css('z-index', 1);
        });
    },
    /**
     * catch the event when the user push enter to send the message.
     * @param chatBoxTextArea
     * @param chatBoxUser
     */
    checkChatBoxInputKey: function(chatBoxTextArea, chatBoxUser) {
        let $chatBoxContent = $('#chatbox_' + chatBoxUser + ' .chatboxcontent');
        if (event.keyCode === 13 && event.shiftKey === false) {
            let message = $.trim($(chatBoxTextArea).val());
            // Get the username from Title chatbox
            let username = $('#chatbox_' + chatBoxUser + ' .chatboxtitle').text();
            let timeStamp = new Date(event.timeStamp);
            timeStamp = Chatoo.pad(timeStamp.getHours()) + ':' + Chatoo.pad(timeStamp.getMinutes()) + ':' + Chatoo.pad(timeStamp.getSeconds());
            $(chatBoxTextArea).val('');
            $(chatBoxTextArea).focus();
            $(chatBoxTextArea).css('height', '44px');
            if (message !== '') {
                message = message.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
                $chatBoxContent.append('<div class="chatboxmessage"><span class="chatboxmessagefrom">Me :</span><span class="timeStamp">at ' + timeStamp + '</span><p class="chatboxmessagecontent">' + message + '</p></div>');
                // Random answer between 1-5 sec
                let randTime = Math.round(Math.floor(Math.random() * 5000) + 1000);
                setTimeout(function() {
                    Chatoo.getRandomSentence(username);
                }, randTime);

                $chatBoxContent.scrollTop($chatBoxContent[0].scrollHeight);
            }
        }
    },
    /**
     * Get randome sentence from sentences
     * @param username
     * @returns null
     */
    getRandomSentence: function(username) {
        const chatboxUser = username.toLowerCase().replace(/\s+/g, '');
        let $chatBoxContent = $('#chatbox_' + chatboxUser + ' .chatboxcontent');
        let $chatBoxTextArea = $('#chatbox_' + chatboxUser + ' .chatboxtextarea');
        let timeStamp = new Date();
        timeStamp = Chatoo.pad(timeStamp.getHours()) + ':' + Chatoo.pad(timeStamp.getMinutes()) + ':' + Chatoo.pad(timeStamp.getSeconds());
        //calculate a random index
        const index = Math.floor(Math.random() * (Chatoo.maxSentences - 1));
        //return the random sentence in chatboxcontent
        $chatBoxContent.append('<div class="chatboxmessage"><span class="chatboxmessagefrom">' + username + ' :</span><span class="timeStamp">at ' + timeStamp + '</span><p class="chatboxmessagecontent">' + sentences[index] + '</p></div>');
        $chatBoxContent.scrollTop($chatBoxContent[0].scrollHeight);
        $chatBoxTextArea.focus();
    },
    /**
     * hide the chatbox
     * @param chatboxUser
     * @returns {undefined}
     */
    closeChatBox: function(chatboxUser) {
        $('#chatbox_' + chatboxUser).css('display', 'none');
    },
    /**
     * add 0 to the number if less then 10
     * @param number
     * @returns {String}
     */
    pad: function(number) {
        return (number < 10 ? '0' : '') + number;
    }
};