$(function () {
    var $form = $("#contactForm");
    var $success = $("#success");

    if (!$form.length) return;

    function escapeHtml(text) {
        return $("<div>").text(text).html();
    }

    function showAlert(type, message) {
        $success.html(
            "<div class='alert alert-" + type + "'>" +
            "<button type='button' class='close' data-dismiss='alert' aria-hidden='true'>&times;</button>" +
            "<strong>" + escapeHtml(message) + "</strong>" +
            "</div>"
        );
    }

    function clearFieldError($field) {
        var $group = $field.closest(".form-group");
        $group.removeClass("has-error");
        $group.find(".help-block.text-danger").text("");
    }

    function setFieldError($field, message) {
        var $group = $field.closest(".form-group");
        $group.addClass("has-error");
        $group.find(".help-block.text-danger").text(message);
    }

    function isValidEmail(value) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }

    function updateCounter(fieldId) {
        var $field = $("#" + fieldId);
        var $counter = $('.char-counter[data-for="' + fieldId + '"]');
        if (!$field.length || !$counter.length) return;
        var len = ($field.val() || "").length;
        var max = parseInt($field.attr("maxlength"), 10) || 0;
        if (max > 0) {
            $counter.text(len + "/" + max);
        } else {
            $counter.text(String(len));
        }
    }

    function updateAllCounters() {
        updateCounter("message");
    }

    $("#contactForm input, #contactForm textarea").on("input blur", function () {
        clearFieldError($(this));
        updateCounter(this.id);
    });

    $("#message").on("input blur", function () {
        var $counter = $('.char-counter[data-for="message"]');
        var hasValue = (($(this).val() || "").length > 0);
        $counter.toggleClass("has-value", hasValue);
    });

    updateAllCounters();

    $form.on("submit", function (e) {
        e.preventDefault();
        $success.empty();

        var $name = $("#name");
        var $email = $("#email");
        var $subject = $("#subject");
        var $message = $("#message");

        var name = ($name.val() || "").trim();
        var email = ($email.val() || "").trim();
        var subject = ($subject.val() || "").trim();
        var message = ($message.val() || "").trim();

        var hasError = false;
        clearFieldError($name);
        clearFieldError($email);
        clearFieldError($subject);
        clearFieldError($message);

        if (!name) {
            setFieldError($name, "Please enter your name.");
            hasError = true;
        }

        if (!email) {
            setFieldError($email, "Please enter your email address.");
            hasError = true;
        } else if (!isValidEmail(email)) {
            setFieldError($email, "Please enter a valid email address.");
            hasError = true;
        }

        if (!message) {
            setFieldError($message, "Please enter your message.");
            hasError = true;
        } else if (message.length > 4000) {
            setFieldError($message, "Message can be maximum 4000 characters.");
            hasError = true;
        }

        if (hasError) {
            // Log invalid submit attempts in backend errored_messages table.
            $.ajax({
                url: "././mail/save_message.php",
                type: "POST",
                dataType: "json",
                cache: false,
                data: {
                    name: name,
                    email: email,
                    subject: subject,
                    message: message
                }
            });
            showAlert("danger", "Please correct the highlighted fields.");
            return;
        }

        $.ajax({
            url: "././mail/save_message.php",
            type: "POST",
            dataType: "json",
            cache: false,
            data: {
                name: name,
                email: email,
                subject: subject,
                message: message
            }
        }).done(function (response) {
            if (!response || response.ok !== true) {
                showAlert("danger", response && response.error ? response.error : "Message could not be saved. Please try again.");
                return;
            }
            showAlert("success", "Your message has been saved.");
            $form.trigger("reset");
            updateAllCounters();
        }).fail(function (xhr) {
            var messageText = "Your message could not be saved. Please try again.";
            try {
                var data = xhr.responseJSON ? xhr.responseJSON : JSON.parse(xhr.responseText);
                if (data && data.error) messageText = data.error;
            } catch (err) {
                // Ignore parse issues and keep fallback message.
            }
            showAlert("danger", messageText);
        });
    });
});
