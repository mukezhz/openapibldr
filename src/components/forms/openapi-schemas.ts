/**
 * OpenAPI JSON schemas for validation and type hints in the Monaco editor
 * Based on OpenAPI Specification 3.0.3
 */

const openAPISchemas = {
  /**
   * Schema for Schema Objects
   * Ref: https://spec.openapis.org/oas/v3.0.3#schema-object
   */
  schema: {
    type: "object",
    properties: {
      type: {
        type: "string",
        enum: ["string", "number", "integer", "boolean", "array", "object", "null"]
      },
      format: {
        type: "string",
        description: "Format of the schema (e.g., date-time, uuid, email)",
        enum: [
          "int32", "int64", "float", "double", "byte", "binary", "date", "date-time",
          "password", "email", "uuid", "uri", "hostname", "ipv4", "ipv6"
        ]
      },
      title: { type: "string" },
      description: { type: "string" },
      default: { },
      multipleOf: { type: "number", exclusiveMinimum: 0 },
      maximum: { type: "number" },
      exclusiveMaximum: { type: "boolean" },
      minimum: { type: "number" },
      exclusiveMinimum: { type: "boolean" },
      maxLength: { type: "integer", minimum: 0 },
      minLength: { type: "integer", minimum: 0 },
      pattern: { type: "string", format: "regex" },
      maxItems: { type: "integer", minimum: 0 },
      minItems: { type: "integer", minimum: 0 },
      uniqueItems: { type: "boolean" },
      maxProperties: { type: "integer", minimum: 0 },
      minProperties: { type: "integer", minimum: 0 },
      required: { 
        type: "array", 
        items: { type: "string" },
        uniqueItems: true
      },
      enum: {
        type: "array",
        items: { },
        uniqueItems: true
      },
      properties: {
        type: "object",
        additionalProperties: {
          $ref: "#/definitions/schema"
        }
      },
      allOf: {
        type: "array",
        items: { $ref: "#/definitions/schema" }
      },
      oneOf: {
        type: "array",
        items: { $ref: "#/definitions/schema" }
      },
      anyOf: {
        type: "array",
        items: { $ref: "#/definitions/schema" }
      },
      not: { $ref: "#/definitions/schema" },
      items: { $ref: "#/definitions/schema" },
      additionalProperties: {
        oneOf: [
          { type: "boolean" },
          { $ref: "#/definitions/schema" }
        ]
      },
      nullable: { type: "boolean" },
      discriminator: {
        type: "object",
        required: ["propertyName"],
        properties: {
          propertyName: { type: "string" },
          mapping: {
            type: "object",
            additionalProperties: { type: "string" }
          }
        }
      },
      readOnly: { type: "boolean" },
      writeOnly: { type: "boolean" },
      xml: {
        type: "object",
        properties: {
          name: { type: "string" },
          namespace: { type: "string", format: "uri" },
          prefix: { type: "string" },
          attribute: { type: "boolean" },
          wrapped: { type: "boolean" }
        }
      },
      externalDocs: {
        type: "object",
        required: ["url"],
        properties: {
          description: { type: "string" },
          url: { type: "string", format: "uri" }
        }
      },
      example: { },
      deprecated: { type: "boolean" }
    },
    definitions: {
      schema: {
        $ref: "#"
      }
    }
  },
  
  /**
   * Schema for Response Objects
   * Ref: https://spec.openapis.org/oas/v3.0.3#response-object
   */
  response: {
    type: "object",
    required: ["description"],
    properties: {
      description: { type: "string" },
      headers: {
        type: "object",
        additionalProperties: {
          oneOf: [
            { $ref: "#/definitions/header" },
            { $ref: "#/definitions/reference" }
          ]
        }
      },
      content: {
        type: "object",
        additionalProperties: {
          $ref: "#/definitions/mediaType"
        }
      },
      links: {
        type: "object",
        additionalProperties: {
          oneOf: [
            { $ref: "#/definitions/link" },
            { $ref: "#/definitions/reference" }
          ]
        }
      }
    },
    definitions: {
      reference: {
        type: "object",
        required: ["$ref"],
        properties: {
          $ref: { type: "string" }
        }
      },
      header: {
        type: "object",
        properties: {
          description: { type: "string" },
          required: { type: "boolean" },
          deprecated: { type: "boolean" },
          allowEmptyValue: { type: "boolean" },
          schema: { }
        }
      },
      mediaType: {
        type: "object",
        properties: {
          schema: {
            oneOf: [
              { type: "object" },
              { $ref: "#/definitions/reference" }
            ]
          },
          example: { },
          examples: {
            type: "object",
            additionalProperties: {
              oneOf: [
                { $ref: "#/definitions/example" },
                { $ref: "#/definitions/reference" }
              ]
            }
          },
          encoding: {
            type: "object",
            additionalProperties: {
              $ref: "#/definitions/encoding"
            }
          }
        }
      },
      encoding: {
        type: "object",
        properties: {
          contentType: { type: "string" },
          headers: {
            type: "object",
            additionalProperties: {
              oneOf: [
                { $ref: "#/definitions/header" },
                { $ref: "#/definitions/reference" }
              ]
            }
          },
          style: { type: "string", enum: ["form", "spaceDelimited", "pipeDelimited", "deepObject"] },
          explode: { type: "boolean" },
          allowReserved: { type: "boolean" }
        }
      },
      example: {
        type: "object",
        properties: {
          summary: { type: "string" },
          description: { type: "string" },
          value: { },
          externalValue: { type: "string", format: "uri" }
        }
      },
      link: {
        type: "object",
        properties: {
          operationRef: { type: "string", format: "uri-reference" },
          operationId: { type: "string" },
          parameters: {
            type: "object",
            additionalProperties: { }
          },
          requestBody: { },
          description: { type: "string" },
          server: {
            type: "object",
            properties: {
              url: { type: "string" },
              description: { type: "string" },
              variables: {
                type: "object",
                additionalProperties: {
                  type: "object",
                  required: ["default"],
                  properties: {
                    enum: { type: "array", items: { type: "string" } },
                    default: { type: "string" },
                    description: { type: "string" }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  
  /**
   * Schema for Parameter Objects
   * Ref: https://spec.openapis.org/oas/v3.0.3#parameter-object
   */
  parameter: {
    type: "object",
    required: ["name", "in"],
    properties: {
      name: { type: "string" },
      in: { type: "string", enum: ["query", "header", "path", "cookie"] },
      description: { type: "string" },
      required: { type: "boolean" },
      deprecated: { type: "boolean" },
      allowEmptyValue: { type: "boolean" },
      style: { type: "string" },
      explode: { type: "boolean" },
      allowReserved: { type: "boolean" },
      schema: { },
      example: { },
      examples: {
        type: "object",
        additionalProperties: {
          oneOf: [
            { type: "object" },
            { $ref: "#/definitions/reference" }
          ]
        }
      },
      content: {
        type: "object",
        additionalProperties: {
          $ref: "#/definitions/mediaType"
        }
      }
    },
    definitions: {
      reference: {
        type: "object",
        required: ["$ref"],
        properties: {
          $ref: { type: "string" }
        }
      },
      mediaType: {
        type: "object",
        properties: {
          schema: { },
          example: { },
          examples: {
            type: "object",
            additionalProperties: { }
          }
        }
      }
    }
  },
  
  /**
   * Schema for Request Body Objects
   * Ref: https://spec.openapis.org/oas/v3.0.3#request-body-object
   */
  requestBody: {
    type: "object",
    required: ["content"],
    properties: {
      description: { type: "string" },
      content: {
        type: "object",
        additionalProperties: {
          $ref: "#/definitions/mediaType"
        }
      },
      required: { type: "boolean", default: false }
    },
    definitions: {
      mediaType: {
        type: "object",
        properties: {
          schema: {
            oneOf: [
              { type: "object" },
              { $ref: "#/definitions/reference" }
            ]
          },
          example: { },
          examples: {
            type: "object",
            additionalProperties: {
              oneOf: [
                { type: "object" },
                { $ref: "#/definitions/reference" }
              ]
            }
          },
          encoding: {
            type: "object",
            additionalProperties: {
              type: "object",
              properties: {
                contentType: { type: "string" },
                headers: {
                  type: "object",
                  additionalProperties: { }
                },
                style: { type: "string" },
                explode: { type: "boolean" },
                allowReserved: { type: "boolean" }
              }
            }
          }
        }
      },
      reference: {
        type: "object",
        required: ["$ref"],
        properties: {
          $ref: { type: "string" }
        }
      }
    }
  },
  
  /**
   * Schema for Example Objects
   * Ref: https://spec.openapis.org/oas/v3.0.3#example-object
   */
  example: {
    type: "object",
    properties: {
      summary: { type: "string" },
      description: { type: "string" },
      value: { },
      externalValue: { type: "string", format: "uri" }
    }
  },
  
  /**
   * Schema for Security Scheme Objects
   * Ref: https://spec.openapis.org/oas/v3.0.3#security-scheme-object
   */
  securityScheme: {
    type: "object",
    required: ["type"],
    properties: {
      type: { 
        type: "string", 
        enum: ["apiKey", "http", "oauth2", "openIdConnect"] 
      },
      description: { type: "string" },
      name: { type: "string" },
      in: { type: "string", enum: ["query", "header", "cookie"] },
      scheme: { type: "string" },
      bearerFormat: { type: "string" },
      flows: {
        type: "object",
        properties: {
          implicit: {
            type: "object",
            required: ["authorizationUrl", "scopes"],
            properties: {
              authorizationUrl: { type: "string", format: "uri" },
              refreshUrl: { type: "string", format: "uri" },
              scopes: {
                type: "object",
                additionalProperties: { type: "string" }
              }
            }
          },
          password: {
            type: "object",
            required: ["tokenUrl", "scopes"],
            properties: {
              tokenUrl: { type: "string", format: "uri" },
              refreshUrl: { type: "string", format: "uri" },
              scopes: {
                type: "object",
                additionalProperties: { type: "string" }
              }
            }
          },
          clientCredentials: {
            type: "object",
            required: ["tokenUrl", "scopes"],
            properties: {
              tokenUrl: { type: "string", format: "uri" },
              refreshUrl: { type: "string", format: "uri" },
              scopes: {
                type: "object",
                additionalProperties: { type: "string" }
              }
            }
          },
          authorizationCode: {
            type: "object",
            required: ["authorizationUrl", "tokenUrl", "scopes"],
            properties: {
              authorizationUrl: { type: "string", format: "uri" },
              tokenUrl: { type: "string", format: "uri" },
              refreshUrl: { type: "string", format: "uri" },
              scopes: {
                type: "object",
                additionalProperties: { type: "string" }
              }
            }
          }
        }
      },
      openIdConnectUrl: { type: "string", format: "uri" }
    },
    oneOf: [
      {
        properties: {
          type: { enum: ["apiKey"] },
          name: { type: "string" },
          in: { enum: ["query", "header", "cookie"] }
        },
        required: ["type", "name", "in"]
      },
      {
        properties: {
          type: { enum: ["http"] },
          scheme: { type: "string" }
        },
        required: ["type", "scheme"]
      },
      {
        properties: {
          type: { enum: ["oauth2"] },
          flows: { type: "object" }
        },
        required: ["type", "flows"]
      },
      {
        properties: {
          type: { enum: ["openIdConnect"] },
          openIdConnectUrl: { type: "string", format: "uri" }
        },
        required: ["type", "openIdConnectUrl"]
      }
    ]
  }
};

export default openAPISchemas;