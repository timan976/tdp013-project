from selenium import webdriver
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.support.ui import WebDriverWait 
import time

def register_user(driver, user_object):
	registerElement = driver.find_element_by_name("register")
	firstName = driver.find_element_by_id("first_name")
	lastName = driver.find_element_by_id("last_name")
	username = driver.find_element_by_id("register_username")
	password = driver.find_element_by_id("register_password")
	passwordRepeat = driver.find_element_by_id("password_repeat")
	email = driver.find_element_by_id("email")
	
	firstName.send_keys(user_object["first_name"])
	lastName.send_keys(user_object["last_name"])
	username.send_keys(user_object["username"])
	password.send_keys(user_object["password"])
	passwordRepeat.send_keys(user_object["password_repeat"])
	email.send_keys(user_object["email"])

	registerElement.submit()

def login_user(driver, username, password):
	inputElement = driver.find_element_by_name("login")
	loginUsername = driver.find_element_by_id("username")
	loginPassword = driver.find_element_by_id("password")
	
	loginUsername.send_keys(username)
	loginPassword.send_keys(password)
	inputElement.submit()

driver = webdriver.Chrome()
driver.get("http://localhost/")

########################################
# Register a user with username "pelle"
# for use in later tests
pelle = {
	"first_name": "Pelle",
	"last_name": "Mattsson",
	"username": "pelle",
	"password": "asd",
	"password_repeat": "asd",
	"email": "pelle@example.com"
}

register_user(driver, pelle)

time.sleep(0.5)

########################################
# Try to register another user with the
# same username ("pelle")
driver.get("http://localhost/")

bosse = {
	"first_name": "Andreas",
	"last_name": "Danielsson",
	"username": "pelle",
	"password": "asd",
	"password_repeat": "asd",
	"email": "bosse@example.com"
}
register_user(driver, bosse)

#Checks for the minus sign when the username is taken
icon_elem = driver.find_element_by_id("username_icon")
assert "icon-minus-sign" in icon_elem.get_attribute("class")

# Change the username to "bosse"
username = driver.find_element_by_id("register_username")
username.clear()
username.send_keys("bosse")
time.sleep(1)

#If the username is free the ok sign will be displayed
icon_elem = driver.find_element_by_id("username_icon")
assert "icon-ok-sign" in icon_elem.get_attribute("class")

registerElement = driver.find_element_by_name("register")
registerElement.submit()
time.sleep(0.5)

# Creates a second user for further testing
driver.get("http://localhost/")

tim = {
	"first_name": "Tim",
	"last_name": "Andersson",
	"username": "tim",
	"password": "asd",
	"password_repeat": "asd",
	"email": "tim@example.com"
}

register_user(driver, tim)

########################################
# Login tim
driver.get("http://localhost/")

login_user(driver, "tim", "fel")
time.sleep(0.5)

# If wrong password or username is entered an error
# sign is showed
login_error_elem = driver.find_element_by_id("login_error")
assert "display: block" in login_error_elem.get_attribute("style")

loginPassword = driver.find_element_by_id("password")
loginPassword.clear()
loginPassword.send_keys("asd")
driver.find_element_by_name("login").submit()
time.sleep(0.5)

########################################
# Search for friend
driver.find_element_by_link_text("Search").click()
time.sleep(0.5)

search_button_elem = driver.find_element_by_css_selector("input[type=submit]")
search_elem = driver.find_element_by_css_selector("input[name=query]")
search_elem.send_keys("pelle")
search_button_elem.click()
time.sleep(0.5)

users_elem = driver.find_element_by_id("search_results")
user = users_elem.find_elements_by_css_selector("a")[0]
assert user.text == "Pelle Mattsson (pelle)"
user.click()
time.sleep(0.5)

########################################
# Add friend
driver.find_element_by_id("friend_button").click()
time.sleep(0.5)

########################################
# Post on friends wall
driver.find_element_by_link_text("Friends").click()
time.sleep(0.5)

driver.find_element_by_link_text("Pelle Mattsson (pelle)").click()
time.sleep(0.5)

inputElement = driver.find_element_by_name("post")
inputElement.send_keys("Test Message")
time.sleep(0.5)
inputElement.submit()
time.sleep(0.5)


messages = driver.find_elements_by_class_name("wallpost")
assert "Test Message" in messages[-1].text

########################################
#             Test logout              #
########################################

logout_link = driver.find_element_by_link_text("Logout");
logout_link.click();
time.sleep(0.5);
assert "Welcome" in driver.find_element_by_css_selector(".welcome > h1").text

driver.quit()

########################################
#             Chat tests               #
#                                      #
# Available users:                     #
# * tim                                #
# * pelle                              #
# * bosse                              #
#                                      #
# All passwords are "asd".             #
########################################

tim_driver = webdriver.Chrome()
pelle_driver = webdriver.Chrome()
bosse_driver = webdriver.Chrome()

# Login tim
tim_driver.get("http://localhost/")
login_user(tim_driver, "tim", "asd")
time.sleep(0.5)

# Login pelle
pelle_driver.get("http://localhost/")
login_user(pelle_driver, "pelle", "asd")
time.sleep(0.5)

# Login bosse
bosse_driver.get("http://localhost/")
login_user(bosse_driver, "bosse", "asd")
time.sleep(0.5)

# Tim goes to Bosses profile
tim_driver.get("http://localhost/user/bosse")
time.sleep(0.5)

# Tim starts a chat with Bosse
tim_driver.find_element_by_id("start_chat").click()
time.sleep(0.5)

# Bosse clicks the chat notification
bosse_driver.find_element_by_link_text("chat").click()
time.sleep(0.5)

# Tim sends the message "Hej"
message_input = tim_driver.find_element_by_name("message")
message_input.send_keys("Hej")
message_input.submit()
time.sleep(1)

# Make sure bosse and tim got the message
bosse_message_elements = bosse_driver.find_elements_by_css_selector("#messages > span")
assert len(bosse_message_elements) == 1
assert bosse_message_elements[0].text == "Tim Andersson: Hej"

tim_message_elements = tim_driver.find_elements_by_css_selector("#messages > span")
assert len(tim_message_elements) == 1
assert tim_message_elements[0].text == "Tim Andersson: Hej"

# Tim invites Pelle to the chat
tim_driver.find_element_by_css_selector("#chat_friends button").click()
time.sleep(0.5)

# Pelle clicks on the chat notification to join the chat
pelle_driver.find_element_by_link_text("chat").click()
time.sleep(0.5)

# Make sure the message was saved in the database and
# pelle can see it
pelle_message_elements = pelle_driver.find_elements_by_css_selector("#messages > span")
assert len(pelle_message_elements) == 1
assert pelle_message_elements[0].text == "Tim Andersson: Hej"

# Pelle sends the message "Tjena!"
message_input = pelle_driver.find_element_by_name("message")
message_input.send_keys("Tjena!")
message_input.submit()
time.sleep(1)

# Make sure everybody got the message
pelle_message_elements = pelle_driver.find_elements_by_css_selector("#messages > span")
assert len(pelle_message_elements) == 2
assert pelle_message_elements[1].text == "Pelle Mattsson: Tjena!"

bosse_message_elements = bosse_driver.find_elements_by_css_selector("#messages > span")
assert len(bosse_message_elements) == 2
assert bosse_message_elements[1].text == "Pelle Mattsson: Tjena!"

tim_message_elements = tim_driver.find_elements_by_css_selector("#messages > span")
assert len(tim_message_elements) == 2
assert tim_message_elements[1].text == "Pelle Mattsson: Tjena!"

tim_driver.quit()
pelle_driver.quit()
bosse_driver.quit()

print "All test passed!"
