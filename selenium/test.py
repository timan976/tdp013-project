from selenium import webdriver
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.support.ui import WebDriverWait 
import time

driver = webdriver.Firefox()

driver.get("http://localhost:8888/")

loginUsername = driver.find_element_by_id("username")
loginPassword = driver.find_element_by_id("password")
loginElement = driver.find_element_by_name("login")

loginUsername.send_keys("safton")
loginPassword.send_keys("asd")

loginElement.submit()

print driver.title

try:
    WebDriverWait(driver, 10).until(lambda driver : driver.title.lower().startswith("cheese"))

    print driver.title
finally:
    driver.quit()
