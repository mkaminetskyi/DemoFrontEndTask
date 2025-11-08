package com.demo.demotaskforfeside.controller;

import com.demo.demotaskforfeside.dto.PriceListResponse;
import com.demo.demotaskforfeside.service.PriceListService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.Map;

@Slf4j
@Controller
@AllArgsConstructor
public class PriceListController {
    private final PriceListService priceListService;


// без цього не запускалось і видавало помилку:
// Whitelabel Error Page
//This application has no explicit mapping for /error, so you are seeing this as a fallback.
//There was an unexpected error (type=Not Found, status=404).

// @GetMapping
    @GetMapping({"/", "/price-list"}) // без цього не запускалось
    public String priceListPage(Model model) {
        model.addAttribute("hasSession", true);

        return "price-list";
    }

    @GetMapping(value = "/price-list-data")
    @ResponseBody
    public ResponseEntity<?> loadPriceList() {
        try {
            return ResponseEntity.ok(new PriceListResponse(priceListService.loadPriceList()));
        } catch (Exception ex) {
            log.error("Failed to load price list", ex);

            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "Не вдалося отримати дані."));
        }
    }
}