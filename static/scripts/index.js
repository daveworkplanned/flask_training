const projectList = document.querySelector('.guides');
const loggedInLinks = document.querySelectorAll('.logged-in');
const loggedOutLinks = document.querySelectorAll('.logged-out');
const API_ROOT = 'https://ldk02iol3d.execute-api.us-west-2.amazonaws.com'
const USER_PATH = '/user'
const IS_LOGGED_IN_PATH = API_ROOT + USER_PATH + '/is_logged_in';

// password configuration
$("#signup-password").on("focusout", function (e) {
    if ($(this).val() != $("#passwordConfirm").val()) {
        $("#passwordConfirm").removeClass("valid").addClass("invalid");
    } else {
        $("#passwordConfirm").removeClass("invalid").addClass("valid");
    }
});

$("#passwordConfirm").on("keyup", function (e) {
    if ($("#signup-password").val() != $(this).val()) {
        $(this).removeClass("valid").addClass("invalid");
    } else {
        $(this).removeClass("invalid").addClass("valid");
    }
});

const setupUI = () => {
    var login_cookie = getCookie('login');

    if (login_cookie) {
        login_cookie_dict = JSON.parse(login_cookie)

        if ("user_id" in login_cookie_dict && "token" in login_cookie_dict) {
            $.ajax({
                type: 'GET',
                url: IS_LOGGED_IN_PATH,
                contentType: 'application/json',
                data: {
                    user_id: login_cookie_dict["user_id"],
                    token: login_cookie_dict["token"]},
                dataType: 'json',

                success: function(data, textStatus, jqXHR) {
                    if (data["message"] === "success") {
                        console.log("user is logged in");
                        flip_login(true, login_cookie_dict["user_id"], login_cookie_dict["token"])
                    } else {
                        console.log("user token validation failure")
                        console.log(data)
                        flip_login(false, null, null)
                    }
                },
                error: function(XMLHttpRequest, textStatus, errorThrown) {
                    flip_login(false, null, null)
                }
            });
        } else { // garbage in the cookie
            flip_login(false, null, null)
        }
    } else { // no cookie
        flip_login(false, null, null)
    }
}

const flip_login = (user_logged_in, user_id, token) => {
    if (user_logged_in) {
        setCookie("login", `{"user_id":"${user_id}","token":"${token}"}`, 365)
    } else {
        setCookie("login", "", 365)
    }
    const loggedInDisplay = ((user_logged_in) ? 'block' : 'none');
    const loggedOutDisplay = ((user_logged_in) ? 'none' : 'block');

    loggedInLinks.forEach(link => link.style.display = loggedInDisplay);
    loggedOutLinks.forEach(link => link.style.display = loggedOutDisplay);
}

const createAdministratorEntry = (is_creator, project_id, administrator_user_id, administrator_user_data) => {
        admin_name = administrator_user_data.first_name + " " + administrator_user_data.last_name;

        let kill_link = "";

        if (!is_creator) {
            kill_link = `
            <a href="#" onclick=removeAdministrator(this,'${project_id}','${administrator_user_id}')><i class="material-icons" style="font-size: .9em">highlight_off</i></a>
            `;
        }
        return `<span user_id=${administrator_user_id}><span>${admin_name}</span><span>${kill_link}</span></span>`;
}

const paintAdministrators = (project_doc, user_data) => {
    project = project_doc.data();

    return Object.keys(project.administrator_users).map(administrator_user_id => {
        return createAdministratorEntry(administrator_user_id === project.created_by_user_id,
                                        project_doc.id,
                                        administrator_user_id,
                                        user_data[administrator_user_id]);
    }).join(", ")
}

const setupProjects = ((data, user_data) => {
    if (data.length) {
        let html = '';
        data.forEach(doc => {
            const project = doc.data();
            const created_by = user_data[project.created_by_user_id];

            const li = `
                <li>
                    <div class="collapsible-header grey lighten-4" style="display: block" onmouseenter="projectHeaderMouseEnter('${doc.id}');" onmouseleave="projectHeaderMouseLeave('${doc.id}');">
                        ${project.name}
                        <span style="float:right">
                            <a href="#" style="visibility: hidden; float: right" id="project_${doc.id}_delete_button")><i class="material-icons">highlight_off</i></a>
                        </span>
                    </div>
                    <div class="collapsible-body white">
                        Created by: ${created_by.first_name} ${created_by.last_name}<br />
                        Administrators: <span id="project_admins_${doc.id}">${paintAdministrators(doc, user_data)}</span>
                        <span id="project_admin_add_link_${doc.id}" style="padding-left: 15px;">
                            <a href="#" onclick=addAdministrator(this,'${doc.id}')>Add</a>
                        </span>
                        <div><span id="project-${doc.id}-error-message" class="red-text text-accent-4"></span></div>
                    </div>
                </li>
            `;
            html += li;
        });

        projectList.innerHTML = html;
     } else {
        projectList.innerHTML = '<h5 class="center-aligned">Log in to view projects</h5>'
     }
})

const projectHeaderMouseEnter = (project_id) => {
    document.querySelector('#project_' + project_id + '_delete_button').style.visibility = "visible";
}

const projectHeaderMouseLeave = (project_id) => {
    document.querySelector('#project_' + project_id + '_delete_button').style.visibility = "hidden";
}

// setup materialize components
document.addEventListener('DOMContentLoaded', function() {

  var modals = document.querySelectorAll('.modal');
  M.Modal.init(modals);

  var items = document.querySelectorAll('.collapsible');
  M.Collapsible.init(items);

});

function setCookie(cname, cvalue, exdays) {
  var d = new Date();
  d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
  var expires = "expires="+d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
  var name = cname + "=";
  var ca = document.cookie.split(';');
  for(var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

function checkCookie() {
  var user = getCookie("username");
  if (user != "") {
    alert("Welcome again " + user);
  } else {
    user = prompt("Please enter your name:", "");
    if (user != "" && user != null) {
      setCookie("username", user, 365);
    }
  }
}