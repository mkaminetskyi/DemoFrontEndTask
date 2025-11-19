package com.demo.demotaskforfeside.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomePageController {
     @GetMapping("/home")
    public String home() {
        return "pages/home/home";
    }
}
