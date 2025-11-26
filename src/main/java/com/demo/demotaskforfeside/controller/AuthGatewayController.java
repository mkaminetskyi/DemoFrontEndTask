package com.demo.demotaskforfeside.controller;

import lombok.extern.slf4j.Slf4j;
import org.apache.catalina.connector.Response;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;

@Slf4j
@Controller
public class AuthGatewayController {

    @GetMapping("/")
    public String authGateway(Model model) {
        model.addAttribute("telegramBotUsername", "SkorkDevelopment_bot");
        model.addAttribute("authenticated", false);


        return "pages/auth-gateway/auth-gateway";
    }

    @PostMapping("/api/auth/telegram/widget")
    public ResponseEntity<String> telegramWidgetAuth(Model model) {
        log.info("Received Telegram Widget auth request");

        return ResponseEntity.ok("OK");
    }

    @PostMapping("/api/auth/telegram")
    public ResponseEntity<String> telegramInitDataAuth(Model model) {
        log.info("Received Telegram InitData auth request");

        return ResponseEntity.ok("OK");
    }
}
