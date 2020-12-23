var app = {
    defaultFancybox: function () {
        var el = $(".fancybox");
        el.on('click', function () {
            $.fancybox.open({
                src: $(this).data('src'),
                type: 'inline',
                opts: {
                    beforeLoad: function (instance, current) {
                        console.info('load');
                    },
                    beforeShow: function (instance, current) {
                        console.info('done!');
                    },
                    afterShow: function () {
                    }
                }
            });
            return false;
        });
    },

    toggleNav: function () {
        var $links = $('#nav-toggle a');
        $links.on('click', function () {
            $('aside .active').removeClass('active');
            if ($(this).hasClass('active')) {
                $(this).removeClass('active');
                return false;
            } else {
                $links.removeClass('active');
                $(this).addClass('active');
                $($(this).attr('href')).addClass('active');
            }
            return false;
        });
    },
    toggleIcons: function () {
        $('.actions').find('.icon-microphone, .icon-eye').on('click', function () {
            $(this).toggleClass('icon-cross');
        });
        $('.switcher-record input').on('change', function () {
            $(this).closest('.switcher').toggleClass('recording');
        });
    },

    tooltip: function () {
        $('.tooltip').hover(function () {
            var tmp = '<div class="tooltip-title">' + $(this).data('tooltip') + '</div>';
            $(this).append(tmp);
        }, function () {
            $(this).find('.tooltip-title').remove();
        });
    },
    gridVideo: function () {
        var counts = $('.video-members .member-video:visible').length;
        if (window.innerWidth > 991) {
            if (counts === 1) {
                this.setCountMembers(1);
            } else if (counts === 2) {
                this.setCountMembers(2);
            } else if (counts === 3) {
                this.setCountMembers(3);
            } else if (counts === 4) {
                this.setCountMembers(4);
            } else if (counts > 4 && counts <= 6) {
                this.setCountMembers('5-6');
            } else if (counts > 7 && counts <= 9) {
                this.setCountMembers('7-9');
            } else if (counts >= 10 && counts <= 12) {
                this.setCountMembers('10-12');
            } else if (counts >= 13 && counts <= 15) {
                this.setCountMembers('13-15');
            } else if (counts === 16) {
                this.setCountMembers('16');
            } else if (counts >= 17 && counts <= 20) {
                this.setCountMembers('17-20');
            } else if (counts >= 21 && counts <= 24) {
                this.setCountMembers('21-24');
            } else if (counts > 24) {
                this.setCountMembers(24);
            }
            console.log(counts);
        } else {
            this.removeClassStartingWith($('#content'), 'members-');
        }
        /*5 - 6
        7 -9
        10-12
        13-16
        17-20
        21-24*/
    },
    setCountMembers: function (name) {
        console.log(name);
        this.removeClassStartingWith($('#content'), 'members-').addClass('members-' + name);
    },

    hideVideo: function () {
        $('.icon-eye').on('click', function () {
            $(this).closest('.member-video').hide();
            var user = $(this).closest('.user');
            if (user.length) {
                var id = user.attr('id').replace('user-', '');
                var video = $('#member-' + id);
                video.find('.icon-cross').removeClass('icon-cross');
                video.slideToggle();
            }
            var member = $(this).closest('.member-video');
            if (member.length) {
                var id = member.attr('id').replace('member-', '');
                $('#user-' + id).find('.icon-eye').addClass('icon-cross');
            }
            app.gridVideo();
        });
    },
    openFullscreen: function (elem) {
        console.log("called full screen");
        if (window.innerWidth > 767) {
            var content = $('#content');
            if (!content.hasClass('full-screen-me') && !content.hasClass('full-screen-member')) {
                var elem = document.getElementById('main-video');
                if (elem.requestFullscreen) {
                    elem.requestFullscreen();
                } else if (elem.mozRequestFullScreen) { /* Firefox */
                    elem.mozRequestFullScreen();
                } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
                    elem.webkitRequestFullscreen();
                } else if (elem.msRequestFullscreen) { /* IE/Edge */
                    elem.msRequestFullscreen();
                }
            }
        }
    },

    toggleVideo: function () {
        var content = $('#content');
        $('.video-main .scale-video').on('click', function () {
            if (content.hasClass('full-screen-me') || $('.member-view .content').hasClass('full-screen-member')) {
                content.removeClass('full-screen-me');
                $('.video-main .member-video.me').prependTo($('.video-members'));
                $('.video-list .member-video.video-trainer').removeClass('full-active').prependTo($('.video-main'))
            } else {
                content.removeClass('full-screen-member');
                if (window.innerWidth < 767) {
                    content.toggleClass('full-screen-trainer');
                }
            }
            if ($('.member-view .content').hasClass('full-screen-member')) {
                content.removeClass('full-screen-member');
                $('.video-list .member-video').removeClass('full-active');
                $('.video-main .member-video.me').prependTo($('.video-members'));
                $('.video-list .member-video.video-trainer').removeClass('full-active').prependTo($('.video-main'))
            }
            // }
        });
        $('.scale-video-trainer, .trainer-view  .member-video.video-trainer .icon-zoom').on('click', function () {
            // if (window.innerWidth > 992) {
            content.removeClass('full-screen-member');
            content.toggleClass('full-all-members');
            if ($('.content.full-all-members').length) {
                $('.video-main .member-video').prependTo($('.video-list .video-members'));
            } else {
                $('.video-list .member-video.video-trainer').prependTo($('.video-main'))
            }
            app.gridVideo();
            // }
        });
        $('.member-video:not(.video-trainer):not(.me) .icon-zoom').on('click', function () {
            // if (window.innerWidth > 992) {
            content.removeClass('full-all-members');
            $('#content').toggleClass('full-screen-member');
            $(this).closest('.member-video').toggleClass('full-active');
            if ($('.full-screen-member').length) {
                $('.video-list .member-video.video-trainer').prependTo($('.video-main'));
            }
            // }
        });
        $('.member-view .member-video.me').on('click', function () {
            // if (window.innerWidth > 992) {
            $('#content').toggleClass('full-screen-me');
            if ($('.full-screen-me').length) {
                $('.video-main .member-video.video-trainer').addClass('full-active').prependTo($('.video-list .video-members'));
                $('.video-list .member-video.me').prependTo($('.video-main'));
            }
            // }
        });
    },

    removeClassStartingWith: function (el, name) {
        el.removeClass(function (index, className) {
            return (className.match(new RegExp("\\S*" + name + "\\S*", 'g')) || []).join(' ')
        });
        return el;
    },

    setHeight: function () {
        var hh = $('#header').innerHeight();
        var h = $(window).innerHeight() - $('#footer').innerHeight() - hh
        $('#content').css({
            height: h
        });
        if (window.innerWidth < 992) {
            $('aside').css({
                height: h,
                top: hh
            });
        } else {
            $('aside').css({
                height: 'auto',
                top: 'auto'
            });
        }
    },
    domain: "meet.punjabistudios.com",
    roomName: "CrossFitSession",
    userData: {
        email: "user@punjabistudios.com",
        first_name: "Punjabi",
        last_name: "User",
        role: "",
    },
    defaultDisplayName: "Punjabi Studios User",
    //------------------------------------------------------------------------///
    init: function () {
        this.defaultFancybox();
        // this.setAutoHeight();
        this.toggleNav();
        this.toggleIcons();
        this.tooltip();
        this.gridVideo();
        this.setHeight();
        this.toggleVideo();
        this.hideVideo();
    }
};


$(document).ready(function () {
    app.init();
});
$(window).resize(function () {
    app.setHeight();
    app.gridVideo();
});
$(document).scroll(function () {

});