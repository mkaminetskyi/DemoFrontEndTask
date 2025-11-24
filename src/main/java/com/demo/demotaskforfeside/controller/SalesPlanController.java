package com.demo.demotaskforfeside.controller;

  import org.springframework.http.MediaType;
  import org.springframework.web.bind.annotation.GetMapping;
  import org.springframework.web.bind.annotation.RequestMapping;
  import org.springframework.web.bind.annotation.RestController;

  import java.util.HashMap;
  import java.util.List;
  import java.util.Map;

  @RestController
  @RequestMapping("/api/sales/plan")
  public class SalesPlanController {

      @GetMapping(value = "/representatives", produces = MediaType.APPLICATION_JSON_VALUE)
      public Map<String, Object> getRepresentatives() {
          Map<String, Object> response = new HashMap<>();

          // Тестові дані - список представників
          List<String> representatives = List.of(
              "Іван Петренко",
              "Марія Коваленко",
              "Олег Сидоренко",
              "Наталія Шевченко"
          );

          response.put("representatives", representatives);
          response.put("selected", representatives); // За замовчуванням всі обрані

          return response;
      }
  }