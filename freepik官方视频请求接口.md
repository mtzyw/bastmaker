# Create a video from text/image - MiniMax Hailuo-02 768p

> Generate a video from text or image using the MiniMax Hailuo-02 768p model.

## OpenAPI

````yaml post /v1/ai/image-to-video/minimax-hailuo-02-768p
paths:
  path: /v1/ai/image-to-video/minimax-hailuo-02-768p
  method: post
  servers:
    - url: https://api.freepik.com
      description: B2B API Production V1
  request:
    security:
      - title: apiKey
        parameters:
          query: {}
          header:
            x-freepik-api-key:
              type: apiKey
              description: >
                Your Freepik API key. Required for authentication. [Learn how to
                obtain an API
                key](https://docs.freepik.com/authentication#obtaining-an-api-key)
          cookie: {}
    parameters:
      path: {}
      query: {}
      header: {}
      cookie: {}
    body:
      application/json:
        schemaArray:
          - type: object
            properties:
              webhook_url:
                allOf:
                  - &ref_0
                    description: >
                      Optional callback URL that will receive asynchronous
                      notifications whenever the task changes status. The
                      payload sent to this URL is the same as the corresponding
                      GET endpoint response, but without the data field.
                    example: https://www.example.com/webhook
                    format: uri
                    type: string
              prompt:
                allOf:
                  - &ref_1
                    description: >-
                      Description of the video. Note: It should be less than
                      2000 characters.
                    example: >-
                      A beautiful sunset over the mountains with birds flying in
                      the sky
                    maxLength: 2000
                    type: string
              prompt_optimizer:
                allOf:
                  - &ref_2
                    default: true
                    description: >-
                      Whether to use the prompt optimizer. If true, the model
                      will automatically optimize the incoming prompt to improve
                      the generation quality.
                    type: boolean
              first_frame_image:
                allOf:
                  - description: >-
                      The model will use the image passed in this parameter as
                      the first frame to generate a video. Supported formats:
                      URL of the image or base64 encoding of the image. Image
                      specifications: format must be JPG, JPEG, or PNG; aspect
                      ratio should be greater than 2:5 and less than 5:2; the
                      shorter side must exceed 300 pixels; file size must not
                      exceed 20MB.
                    example: >-
                      https://img.freepik.com/free-photo/beautiful-sunset-over-mountains_123456-7890.jpg
                    type: string
              last_frame_image:
                allOf:
                  - description: >-
                      The model will use the image passed in this parameter as
                      the last frame to generate a video. Supported formats: URL
                      of the image or base64 encoding of the image. Image
                      specifications: format must be JPG, JPEG, or PNG; aspect
                      ratio should be greater than 2:5 and less than 5:2; the
                      shorter side must exceed 300 pixels; file size must not
                      exceed 20MB.
                    example: >-
                      https://img.freepik.com/free-photo/beautiful-sunset-over-mountains_123456-7890.jpg
                    type: string
              duration:
                allOf:
                  - default: 6
                    description: Video length in seconds
                    enum:
                      - 6
                      - 10
                    example: 6
                    type: integer
            required: true
            title: Image to Video
            refIdentifier: '#/components/schemas/minimax-hailuo-02-base'
            requiredProperties:
              - prompt
              - first_frame_image
          - type: object
            properties:
              webhook_url:
                allOf:
                  - *ref_0
              prompt:
                allOf:
                  - *ref_1
              prompt_optimizer:
                allOf:
                  - *ref_2
              duration:
                allOf:
                  - default: 6
                    description: Video length in seconds
                    enum:
                      - 6
                      - 10
                    example: 6
                    type: integer
            required: true
            title: Text to Video
            refIdentifier: '#/components/schemas/minimax-hailuo-02-base'
            requiredProperties:
              - prompt
        examples:
          example:
            value:
              webhook_url: https://www.example.com/webhook
              prompt: >-
                A beautiful sunset over the mountains with birds flying in the
                sky
              prompt_optimizer: true
              first_frame_image: >-
                https://img.freepik.com/free-photo/beautiful-sunset-over-mountains_123456-7890.jpg
              last_frame_image: >-
                https://img.freepik.com/free-photo/beautiful-sunset-over-mountains_123456-7890.jpg
              duration: 6
  response:
    '200':
      application/json:
        schemaArray:
          - type: object
            properties:
              data:
                allOf:
                  - $ref: '#/components/schemas/task'
            refIdentifier: '#/components/schemas/create_image_from_text_flux_200_response'
            requiredProperties:
              - data
            example:
              data:
                task_id: 046b6c7f-0b8a-43b9-b35d-6489e6daee91
                status: CREATED
        examples:
          example:
            value:
              data:
                task_id: 046b6c7f-0b8a-43b9-b35d-6489e6daee91
                status: CREATED
        description: OK - Task created successfully
    '400':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - &ref_3
                    type: string
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_400_response'
            example: &ref_4
              message: message
        examples:
          invalid_page:
            summary: Parameter 'page' is not valid
            value:
              message: Parameter 'page' must be greater than 0
          invalid_query:
            summary: Parameter 'query' is not valid
            value:
              message: Parameter 'query' must not be empty
          invalid_filter:
            summary: Parameter 'filter' is not valid
            value:
              message: Parameter 'filter' is not valid
          generic_bad_request:
            summary: Bad Request
            value:
              message: Parameter ':attribute' is not valid
        description: >-
          Bad Request - The server could not understand the request due to
          invalid syntax.
      application/problem+json:
        schemaArray:
          - type: object
            properties:
              problem:
                allOf:
                  - $ref: >-
                      #/components/schemas/get_all_style_transfer_tasks_400_response_1_problem
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_400_response_1'
        examples:
          invalid_page:
            summary: Parameter 'page' is not valid
            value:
              message: Your request parameters didn't validate.
              invalid_params:
                - name: page
                  reason: Parameter 'page' must be greater than 0
                - name: per_page
                  reason: Parameter 'per_page' must be greater than 0
        description: >-
          Bad Request - The server could not understand the request due to
          invalid syntax.
    '401':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - *ref_3
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_400_response'
            example: *ref_4
        examples:
          invalid_api_key:
            summary: API key is not valid
            value:
              message: Invalid API key
          missing_api_key:
            summary: API key is not provided
            value:
              message: Missing API key
        description: >-
          Unauthorized - The client must authenticate itself to get the
          requested response.
    '500':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - example: Internal Server Error
                    type: string
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_500_response'
            example:
              message: Internal Server Error
        examples:
          example:
            value:
              message: Internal Server Error
        description: >-
          Internal Server Error - The server has encountered a situation it
          doesn't know how to handle.
    '503':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - example: Service Unavailable. Please try again later.
                    type: string
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_503_response'
            example:
              message: Service Unavailable. Please try again later.
        examples:
          example:
            value:
              message: Service Unavailable. Please try again later.
        description: Service Unavailable
  deprecated: false
  type: path
components:
  schemas:
    task:
      example:
        task_id: 046b6c7f-0b8a-43b9-b35d-6489e6daee91
        status: CREATED
      properties:
        task_id:
          description: Task identifier
          format: uuid
          type: string
        status:
          description: Task status
          enum:
            - CREATED
            - IN_PROGRESS
            - COMPLETED
            - FAILED
          type: string
      required:
        - status
        - task_id
      type: object
    get_all_style_transfer_tasks_400_response_1_problem_invalid_params_inner:
      properties:
        name:
          example: page
          type: string
        reason:
          example: Parameter 'page' must be greater than 0
          type: string
      required:
        - name
        - reason
      type: object
    get_all_style_transfer_tasks_400_response_1_problem:
      properties:
        message:
          example: Your request parameters didn't validate.
          type: string
        invalid_params:
          items:
            $ref: >-
              #/components/schemas/get_all_style_transfer_tasks_400_response_1_problem_invalid_params_inner
          type: array
      required:
        - invalid_params
        - message
      type: object

````
# Create a video from text/image - MiniMax Hailuo-02 1080p

> Generate a video from text or image using the MiniMax Hailuo-02 1080p model.

## OpenAPI

````yaml post /v1/ai/image-to-video/minimax-hailuo-02-1080p
paths:
  path: /v1/ai/image-to-video/minimax-hailuo-02-1080p
  method: post
  servers:
    - url: https://api.freepik.com
      description: B2B API Production V1
  request:
    security:
      - title: apiKey
        parameters:
          query: {}
          header:
            x-freepik-api-key:
              type: apiKey
              description: >
                Your Freepik API key. Required for authentication. [Learn how to
                obtain an API
                key](https://docs.freepik.com/authentication#obtaining-an-api-key)
          cookie: {}
    parameters:
      path: {}
      query: {}
      header: {}
      cookie: {}
    body:
      application/json:
        schemaArray:
          - type: object
            properties:
              webhook_url:
                allOf:
                  - &ref_0
                    description: >
                      Optional callback URL that will receive asynchronous
                      notifications whenever the task changes status. The
                      payload sent to this URL is the same as the corresponding
                      GET endpoint response, but without the data field.
                    example: https://www.example.com/webhook
                    format: uri
                    type: string
              prompt:
                allOf:
                  - &ref_1
                    description: >-
                      Description of the video. Note: It should be less than
                      2000 characters.
                    example: >-
                      A beautiful sunset over the mountains with birds flying in
                      the sky
                    maxLength: 2000
                    type: string
              prompt_optimizer:
                allOf:
                  - &ref_2
                    default: true
                    description: >-
                      Whether to use the prompt optimizer. If true, the model
                      will automatically optimize the incoming prompt to improve
                      the generation quality.
                    type: boolean
              first_frame_image:
                allOf:
                  - description: >-
                      The model will use the image passed in this parameter as
                      the first frame to generate a video. Supported formats:
                      URL of the image or base64 encoding of the image. Image
                      specifications: format must be JPG, JPEG, or PNG; aspect
                      ratio should be greater than 2:5 and less than 5:2; the
                      shorter side must exceed 300 pixels; file size must not
                      exceed 20MB.
                    example: >-
                      https://img.freepik.com/free-photo/beautiful-sunset-over-mountains_123456-7890.jpg
                    type: string
              last_frame_image:
                allOf:
                  - description: >-
                      The model will use the image passed in this parameter as
                      the last frame to generate a video. Supported formats: URL
                      of the image or base64 encoding of the image. Image
                      specifications: format must be JPG, JPEG, or PNG; aspect
                      ratio should be greater than 2:5 and less than 5:2; the
                      shorter side must exceed 300 pixels; file size must not
                      exceed 20MB.
                    example: >-
                      https://img.freepik.com/free-photo/beautiful-sunset-over-mountains_123456-7890.jpg
                    type: string
              duration:
                allOf:
                  - default: 6
                    description: Video length in seconds (1080P only supports 6 seconds)
                    enum:
                      - 6
                    example: 6
                    type: integer
            required: true
            title: Image to Video
            refIdentifier: '#/components/schemas/minimax-hailuo-02-base'
            requiredProperties:
              - prompt
              - first_frame_image
          - type: object
            properties:
              webhook_url:
                allOf:
                  - *ref_0
              prompt:
                allOf:
                  - *ref_1
              prompt_optimizer:
                allOf:
                  - *ref_2
              duration:
                allOf:
                  - default: 6
                    description: Video length in seconds (1080P only supports 6 seconds)
                    enum:
                      - 6
                    example: 6
                    type: integer
            required: true
            title: Text to Video
            refIdentifier: '#/components/schemas/minimax-hailuo-02-base'
            requiredProperties:
              - prompt
        examples:
          example:
            value:
              webhook_url: https://www.example.com/webhook
              prompt: >-
                A beautiful sunset over the mountains with birds flying in the
                sky
              prompt_optimizer: true
              first_frame_image: >-
                https://img.freepik.com/free-photo/beautiful-sunset-over-mountains_123456-7890.jpg
              last_frame_image: >-
                https://img.freepik.com/free-photo/beautiful-sunset-over-mountains_123456-7890.jpg
              duration: 6
  response:
    '200':
      application/json:
        schemaArray:
          - type: object
            properties:
              data:
                allOf:
                  - $ref: '#/components/schemas/task'
            refIdentifier: '#/components/schemas/create_image_from_text_flux_200_response'
            requiredProperties:
              - data
            example:
              data:
                task_id: 046b6c7f-0b8a-43b9-b35d-6489e6daee91
                status: CREATED
        examples:
          example:
            value:
              data:
                task_id: 046b6c7f-0b8a-43b9-b35d-6489e6daee91
                status: CREATED
        description: OK - Task created successfully
    '400':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - &ref_3
                    type: string
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_400_response'
            example: &ref_4
              message: message
        examples:
          invalid_page:
            summary: Parameter 'page' is not valid
            value:
              message: Parameter 'page' must be greater than 0
          invalid_query:
            summary: Parameter 'query' is not valid
            value:
              message: Parameter 'query' must not be empty
          invalid_filter:
            summary: Parameter 'filter' is not valid
            value:
              message: Parameter 'filter' is not valid
          generic_bad_request:
            summary: Bad Request
            value:
              message: Parameter ':attribute' is not valid
        description: >-
          Bad Request - The server could not understand the request due to
          invalid syntax.
      application/problem+json:
        schemaArray:
          - type: object
            properties:
              problem:
                allOf:
                  - $ref: >-
                      #/components/schemas/get_all_style_transfer_tasks_400_response_1_problem
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_400_response_1'
        examples:
          invalid_page:
            summary: Parameter 'page' is not valid
            value:
              message: Your request parameters didn't validate.
              invalid_params:
                - name: page
                  reason: Parameter 'page' must be greater than 0
                - name: per_page
                  reason: Parameter 'per_page' must be greater than 0
        description: >-
          Bad Request - The server could not understand the request due to
          invalid syntax.
    '401':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - *ref_3
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_400_response'
            example: *ref_4
        examples:
          invalid_api_key:
            summary: API key is not valid
            value:
              message: Invalid API key
          missing_api_key:
            summary: API key is not provided
            value:
              message: Missing API key
        description: >-
          Unauthorized - The client must authenticate itself to get the
          requested response.
    '500':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - example: Internal Server Error
                    type: string
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_500_response'
            example:
              message: Internal Server Error
        examples:
          example:
            value:
              message: Internal Server Error
        description: >-
          Internal Server Error - The server has encountered a situation it
          doesn't know how to handle.
    '503':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - example: Service Unavailable. Please try again later.
                    type: string
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_503_response'
            example:
              message: Service Unavailable. Please try again later.
        examples:
          example:
            value:
              message: Service Unavailable. Please try again later.
        description: Service Unavailable
  deprecated: false
  type: path
components:
  schemas:
    task:
      example:
        task_id: 046b6c7f-0b8a-43b9-b35d-6489e6daee91
        status: CREATED
      properties:
        task_id:
          description: Task identifier
          format: uuid
          type: string
        status:
          description: Task status
          enum:
            - CREATED
            - IN_PROGRESS
            - COMPLETED
            - FAILED
          type: string
      required:
        - status
        - task_id
      type: object
    get_all_style_transfer_tasks_400_response_1_problem_invalid_params_inner:
      properties:
        name:
          example: page
          type: string
        reason:
          example: Parameter 'page' must be greater than 0
          type: string
      required:
        - name
        - reason
      type: object
    get_all_style_transfer_tasks_400_response_1_problem:
      properties:
        message:
          example: Your request parameters didn't validate.
          type: string
        invalid_params:
          items:
            $ref: >-
              #/components/schemas/get_all_style_transfer_tasks_400_response_1_problem_invalid_params_inner
          type: array
      required:
        - invalid_params
        - message
      type: object

````
# Create a video from an image - Kling 2.1 master model

> Generate a video from an image using the Kling 2.1 Master model.

## OpenAPI

````yaml post /v1/ai/image-to-video/kling-v2-1-master
paths:
  path: /v1/ai/image-to-video/kling-v2-1-master
  method: post
  servers:
    - url: https://api.freepik.com
      description: B2B API Production V1
  request:
    security:
      - title: apiKey
        parameters:
          query: {}
          header:
            x-freepik-api-key:
              type: apiKey
              description: >
                Your Freepik API key. Required for authentication. [Learn how to
                obtain an API
                key](https://docs.freepik.com/authentication#obtaining-an-api-key)
          cookie: {}
    parameters:
      path: {}
      query: {}
      header: {}
      cookie: {}
    body:
      application/json:
        schemaArray:
          - type: object
            properties:
              webhook_url:
                allOf:
                  - description: >
                      Optional callback URL that will receive asynchronous
                      notifications whenever the task changes status. The
                      payload sent to this URL is the same as the corresponding
                      GET endpoint response, but without the data field.
                    example: https://www.example.com/webhook
                    format: uri
                    type: string
              image:
                allOf:
                  - description: >-
                      Reference Image. Supports Base64 encoding or URL (ensure
                      accessibility). For URL, must be publicly accessible. The
                      image file size cannot exceed 10MB, and the resolution
                      should not be less than 300x300px. Aspect ratio should be
                      between 1:2.5 ~ 2.5:1.
                    type: string
              prompt:
                allOf:
                  - description: >-
                      (`Required when image is not provided`) Text prompt
                      describing the desired motion, cannot exceed 2500
                      characters
                    type: string
              negative_prompt:
                allOf:
                  - description: >-
                      Text prompt describing what to avoid in the generated
                      video, cannot exceed 2500 characters
                    type: string
              duration:
                allOf:
                  - description: Duration of the generated video in seconds
                    enum:
                      - '5'
                      - '10'
                    type: string
              cfg_scale:
                allOf:
                  - default: 0.5
                    description: >-
                      Flexibility in video generation; The higher the value, the
                      lower the model's degree of flexibility, and the stronger
                      the relevance to the user's prompt.
                    format: float
                    maximum: 1
                    minimum: 0
                    type: number
              static_mask:
                allOf:
                  - description: >-
                      Static mask image for defining motion brush application
                      areas.


                      ● Supports both Base64 encoding and image URLs (ensure
                      URLs are publicly accessible and follow the same format
                      requirements as the `image` field).

                      ● Supported image formats include .jpg / .jpeg / .png.

                      ● The aspect ratio of the mask image MUST match the input
                      image (`image` field); otherwise, the task will fail.

                      ● The resolutions of the `static_mask` image and the
                      `dynamic_masks.mask` images must be identical; otherwise,
                      the task will fail.

                      ● The static brush feature allows you to define areas
                      where motion will be applied in the generated video.
                    type: string
              dynamic_masks:
                allOf:
                  - items:
                      $ref: >-
                        #/components/schemas/itvkp_request_content_dynamic_masks_inner
                    type: array
            required: true
            title: Image to Video
            refIdentifier: '#/components/schemas/itvkv2-1-request-content'
            requiredProperties:
              - duration
          - type: object
            properties:
              webhook_url:
                allOf:
                  - description: >
                      Optional callback URL that will receive asynchronous
                      notifications whenever the task changes status. The
                      payload sent to this URL is the same as the corresponding
                      GET endpoint response, but without the data field.
                    example: https://www.example.com/webhook
                    format: uri
                    type: string
              prompt:
                allOf:
                  - description: >-
                      Text prompt describing the desired motion, cannot exceed
                      2500 characters
                    type: string
              negative_prompt:
                allOf:
                  - description: >-
                      Text prompt describing what to avoid in the generated
                      video, cannot exceed 2500 characters
                    type: string
              duration:
                allOf:
                  - description: Duration of the generated video in seconds
                    enum:
                      - '5'
                      - '10'
                    type: string
              aspect_ratio:
                allOf:
                  - default: widescreen_16_9
                    description: >-
                      (`Only works when image is not provided`) Aspect ratio for
                      the generated video 
                    enum:
                      - widescreen_16_9
                      - social_story_9_16
                      - square_1_1
                    type: string
              cfg_scale:
                allOf:
                  - default: 0.5
                    description: >-
                      Flexibility in video generation; The higher the value, the
                      lower the model's degree of flexibility, and the stronger
                      the relevance to the user's prompt.
                    format: float
                    maximum: 1
                    minimum: 0
                    type: number
            required: true
            title: Text to Video
            refIdentifier: '#/components/schemas/ttvkv2-1-request-content'
            requiredProperties:
              - duration
        examples:
          example:
            value:
              webhook_url: https://www.example.com/webhook
              image: <string>
              prompt: <string>
              negative_prompt: <string>
              duration: '5'
              cfg_scale: 0.5
              static_mask: <string>
              dynamic_masks:
                - mask: <string>
                  trajectories:
                    - x: 123
                      'y': 123
  response:
    '200':
      application/json:
        schemaArray:
          - type: object
            properties:
              data:
                allOf:
                  - $ref: '#/components/schemas/task'
            refIdentifier: '#/components/schemas/create_image_from_text_flux_200_response'
            requiredProperties:
              - data
            example:
              data:
                task_id: 046b6c7f-0b8a-43b9-b35d-6489e6daee91
                status: CREATED
        examples:
          example:
            value:
              data:
                task_id: 046b6c7f-0b8a-43b9-b35d-6489e6daee91
                status: CREATED
        description: OK - Get the status of the kling-std task
    '400':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - &ref_0
                    type: string
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_400_response'
            example: &ref_1
              message: message
        examples:
          invalid_page:
            summary: Parameter 'page' is not valid
            value:
              message: Parameter 'page' must be greater than 0
          invalid_query:
            summary: Parameter 'query' is not valid
            value:
              message: Parameter 'query' must not be empty
          invalid_filter:
            summary: Parameter 'filter' is not valid
            value:
              message: Parameter 'filter' is not valid
          generic_bad_request:
            summary: Bad Request
            value:
              message: Parameter ':attribute' is not valid
        description: >-
          Bad Request - The server could not understand the request due to
          invalid syntax.
      application/problem+json:
        schemaArray:
          - type: object
            properties:
              problem:
                allOf:
                  - $ref: >-
                      #/components/schemas/get_all_style_transfer_tasks_400_response_1_problem
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_400_response_1'
        examples:
          invalid_page:
            summary: Parameter 'page' is not valid
            value:
              message: Your request parameters didn't validate.
              invalid_params:
                - name: page
                  reason: Parameter 'page' must be greater than 0
                - name: per_page
                  reason: Parameter 'per_page' must be greater than 0
        description: >-
          Bad Request - The server could not understand the request due to
          invalid syntax.
    '401':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - *ref_0
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_400_response'
            example: *ref_1
        examples:
          invalid_api_key:
            summary: API key is not valid
            value:
              message: Invalid API key
          missing_api_key:
            summary: API key is not provided
            value:
              message: Missing API key
        description: >-
          Unauthorized - The client must authenticate itself to get the
          requested response.
    '500':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - example: Internal Server Error
                    type: string
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_500_response'
            example:
              message: Internal Server Error
        examples:
          example:
            value:
              message: Internal Server Error
        description: >-
          Internal Server Error - The server has encountered a situation it
          doesn't know how to handle.
    '503':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - example: Service Unavailable. Please try again later.
                    type: string
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_503_response'
            example:
              message: Service Unavailable. Please try again later.
        examples:
          example:
            value:
              message: Service Unavailable. Please try again later.
        description: Service Unavailable
  deprecated: false
  type: path
components:
  schemas:
    task:
      example:
        task_id: 046b6c7f-0b8a-43b9-b35d-6489e6daee91
        status: CREATED
      properties:
        task_id:
          description: Task identifier
          format: uuid
          type: string
        status:
          description: Task status
          enum:
            - CREATED
            - IN_PROGRESS
            - COMPLETED
            - FAILED
          type: string
      required:
        - status
        - task_id
      type: object
    get_all_style_transfer_tasks_400_response_1_problem_invalid_params_inner:
      properties:
        name:
          example: page
          type: string
        reason:
          example: Parameter 'page' must be greater than 0
          type: string
      required:
        - name
        - reason
      type: object
    get_all_style_transfer_tasks_400_response_1_problem:
      properties:
        message:
          example: Your request parameters didn't validate.
          type: string
        invalid_params:
          items:
            $ref: >-
              #/components/schemas/get_all_style_transfer_tasks_400_response_1_problem_invalid_params_inner
          type: array
      required:
        - invalid_params
        - message
      type: object
    itvkp_request_content_dynamic_masks_inner_trajectories_inner:
      properties:
        x:
          description: Horizontal coordinate (X-coordinate) in 2D pixel system.
          type: integer
        'y':
          description: Vertical coordinate (Y-coordinate) in 2D pixel system.
          type: integer
      required:
        - x
        - 'y'
      type: object
    itvkp_request_content_dynamic_masks_inner:
      properties:
        mask:
          description: >-
            Dynamic mask image for defining motion brush application areas with
            trajectories.


            ● Support inputting image Base64 encoding or image URL (ensure the
            URL is accessible and follows the same format requirements as the
            image field).

            ● Supported image formats include .jpg / .jpeg / .png

            ● The aspect ratio of the mask image must match the input image
            (image field); otherwise, the task will fail (failed).

            ● The resolutions of the static_mask image and the
            dynamic_masks.mask image must be identical; otherwise, the task will
            fail (failed).
          type: string
        trajectories:
          description: Motion Trajectory Coordinate Sequence
          items:
            $ref: >-
              #/components/schemas/itvkp_request_content_dynamic_masks_inner_trajectories_inner
          type: array
      required:
        - mask
        - trajectories
      type: object

````
# Create a video from an image - Kling 2.1 pro model

> Generate a video from an image using the Kling 2.1 Pro model.

## OpenAPI

````yaml post /v1/ai/image-to-video/kling-v2-1-pro
paths:
  path: /v1/ai/image-to-video/kling-v2-1-pro
  method: post
  servers:
    - url: https://api.freepik.com
      description: B2B API Production V1
  request:
    security:
      - title: apiKey
        parameters:
          query: {}
          header:
            x-freepik-api-key:
              type: apiKey
              description: >
                Your Freepik API key. Required for authentication. [Learn how to
                obtain an API
                key](https://docs.freepik.com/authentication#obtaining-an-api-key)
          cookie: {}
    parameters:
      path: {}
      query: {}
      header: {}
      cookie: {}
    body:
      application/json:
        schemaArray:
          - type: object
            properties:
              webhook_url:
                allOf:
                  - description: >
                      Optional callback URL that will receive asynchronous
                      notifications whenever the task changes status. The
                      payload sent to this URL is the same as the corresponding
                      GET endpoint response, but without the data field.
                    example: https://www.example.com/webhook
                    format: uri
                    type: string
              image:
                allOf:
                  - description: >-
                      Reference Image. Supports Base64 encoding or URL (ensure
                      accessibility). For URL, must be publicly accessible. The
                      image file size cannot exceed 10MB, and the resolution
                      should not be less than 300x300px. Aspect ratio should be
                      between 1:2.5 ~ 2.5:1.
                    type: string
              image_tail:
                allOf:
                  - description: >-
                      Reference Image - End frame control. Supports Base64
                      encoding or URL. For URL, must be publicly accessible.
                      Must follow the same format requirements as the 'image'
                      field. (Optional) Not compatible with standard mode.


                      ● Supported image formats include .jpg / .jpeg / .png

                      ● The image file size cannot exceed 10MB, and the image
                      resolution should not be less than 300*300px

                      ● At least one parameter should be filled in between
                      parameter image and parameter image_tail; cannot both be
                      empty at the same time
                    type: string
              prompt:
                allOf:
                  - description: >-
                      (`Required when image is not provided`) Text prompt
                      describing the desired motion, cannot exceed 2500
                      characters
                    type: string
              negative_prompt:
                allOf:
                  - description: >-
                      Text prompt describing what to avoid in the generated
                      video, cannot exceed 2500 characters
                    type: string
              duration:
                allOf:
                  - description: Duration of the generated video in seconds
                    enum:
                      - '5'
                      - '10'
                    type: string
              cfg_scale:
                allOf:
                  - default: 0.5
                    description: >-
                      Flexibility in video generation; The higher the value, the
                      lower the model's degree of flexibility, and the stronger
                      the relevance to the user's prompt.
                    format: float
                    maximum: 1
                    minimum: 0
                    type: number
              static_mask:
                allOf:
                  - description: >-
                      Static mask image for defining motion brush application
                      areas.


                      ● Supports both Base64 encoding and image URLs (ensure
                      URLs are publicly accessible and follow the same format
                      requirements as the `image` field).

                      ● Supported image formats include .jpg / .jpeg / .png.

                      ● The aspect ratio of the mask image MUST match the input
                      image (`image` field); otherwise, the task will fail.

                      ● The resolutions of the `static_mask` image and the
                      `dynamic_masks.mask` images must be identical; otherwise,
                      the task will fail.

                      ● The static brush feature allows you to define areas
                      where motion will be applied in the generated video.
                    type: string
              dynamic_masks:
                allOf:
                  - items:
                      $ref: >-
                        #/components/schemas/itvkp_request_content_dynamic_masks_inner
                    type: array
            required: true
            title: Image to Video
            refIdentifier: '#/components/schemas/itvkv2-1-pro-request-content'
            requiredProperties:
              - duration
        examples:
          example:
            value:
              webhook_url: https://www.example.com/webhook
              image: <string>
              image_tail: <string>
              prompt: <string>
              negative_prompt: <string>
              duration: '5'
              cfg_scale: 0.5
              static_mask: <string>
              dynamic_masks:
                - mask: <string>
                  trajectories:
                    - x: 123
                      'y': 123
  response:
    '200':
      application/json:
        schemaArray:
          - type: object
            properties:
              data:
                allOf:
                  - $ref: '#/components/schemas/task'
            refIdentifier: '#/components/schemas/create_image_from_text_flux_200_response'
            requiredProperties:
              - data
            example:
              data:
                task_id: 046b6c7f-0b8a-43b9-b35d-6489e6daee91
                status: CREATED
        examples:
          example:
            value:
              data:
                task_id: 046b6c7f-0b8a-43b9-b35d-6489e6daee91
                status: CREATED
        description: OK - Get the status of the kling-v2-1-pro task
    '400':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - &ref_0
                    type: string
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_400_response'
            example: &ref_1
              message: message
        examples:
          invalid_page:
            summary: Parameter 'page' is not valid
            value:
              message: Parameter 'page' must be greater than 0
          invalid_query:
            summary: Parameter 'query' is not valid
            value:
              message: Parameter 'query' must not be empty
          invalid_filter:
            summary: Parameter 'filter' is not valid
            value:
              message: Parameter 'filter' is not valid
          generic_bad_request:
            summary: Bad Request
            value:
              message: Parameter ':attribute' is not valid
        description: >-
          Bad Request - The server could not understand the request due to
          invalid syntax.
      application/problem+json:
        schemaArray:
          - type: object
            properties:
              problem:
                allOf:
                  - $ref: >-
                      #/components/schemas/get_all_style_transfer_tasks_400_response_1_problem
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_400_response_1'
        examples:
          invalid_page:
            summary: Parameter 'page' is not valid
            value:
              message: Your request parameters didn't validate.
              invalid_params:
                - name: page
                  reason: Parameter 'page' must be greater than 0
                - name: per_page
                  reason: Parameter 'per_page' must be greater than 0
        description: >-
          Bad Request - The server could not understand the request due to
          invalid syntax.
    '401':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - *ref_0
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_400_response'
            example: *ref_1
        examples:
          invalid_api_key:
            summary: API key is not valid
            value:
              message: Invalid API key
          missing_api_key:
            summary: API key is not provided
            value:
              message: Missing API key
        description: >-
          Unauthorized - The client must authenticate itself to get the
          requested response.
    '500':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - example: Internal Server Error
                    type: string
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_500_response'
            example:
              message: Internal Server Error
        examples:
          example:
            value:
              message: Internal Server Error
        description: >-
          Internal Server Error - The server has encountered a situation it
          doesn't know how to handle.
    '503':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - example: Service Unavailable. Please try again later.
                    type: string
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_503_response'
            example:
              message: Service Unavailable. Please try again later.
        examples:
          example:
            value:
              message: Service Unavailable. Please try again later.
        description: Service Unavailable
  deprecated: false
  type: path
components:
  schemas:
    task:
      example:
        task_id: 046b6c7f-0b8a-43b9-b35d-6489e6daee91
        status: CREATED
      properties:
        task_id:
          description: Task identifier
          format: uuid
          type: string
        status:
          description: Task status
          enum:
            - CREATED
            - IN_PROGRESS
            - COMPLETED
            - FAILED
          type: string
      required:
        - status
        - task_id
      type: object
    get_all_style_transfer_tasks_400_response_1_problem_invalid_params_inner:
      properties:
        name:
          example: page
          type: string
        reason:
          example: Parameter 'page' must be greater than 0
          type: string
      required:
        - name
        - reason
      type: object
    get_all_style_transfer_tasks_400_response_1_problem:
      properties:
        message:
          example: Your request parameters didn't validate.
          type: string
        invalid_params:
          items:
            $ref: >-
              #/components/schemas/get_all_style_transfer_tasks_400_response_1_problem_invalid_params_inner
          type: array
      required:
        - invalid_params
        - message
      type: object
    itvkp_request_content_dynamic_masks_inner_trajectories_inner:
      properties:
        x:
          description: Horizontal coordinate (X-coordinate) in 2D pixel system.
          type: integer
        'y':
          description: Vertical coordinate (Y-coordinate) in 2D pixel system.
          type: integer
      required:
        - x
        - 'y'
      type: object
    itvkp_request_content_dynamic_masks_inner:
      properties:
        mask:
          description: >-
            Dynamic mask image for defining motion brush application areas with
            trajectories.


            ● Support inputting image Base64 encoding or image URL (ensure the
            URL is accessible and follows the same format requirements as the
            image field).

            ● Supported image formats include .jpg / .jpeg / .png

            ● The aspect ratio of the mask image must match the input image
            (image field); otherwise, the task will fail (failed).

            ● The resolutions of the static_mask image and the
            dynamic_masks.mask image must be identical; otherwise, the task will
            fail (failed).
          type: string
        trajectories:
          description: Motion Trajectory Coordinate Sequence
          items:
            $ref: >-
              #/components/schemas/itvkp_request_content_dynamic_masks_inner_trajectories_inner
          type: array
      required:
        - mask
        - trajectories
      type: object

````
# Video extension using PixVerse-V5

> Generate a video using the PixVerse-V5 model. Resolution is specified in the request body.

## OpenAPI

````yaml post /v1/ai/image-to-video/pixverse-v5
paths:
  path: /v1/ai/image-to-video/pixverse-v5
  method: post
  servers:
    - url: https://api.freepik.com
      description: B2B API Production V1
  request:
    security:
      - title: apiKey
        parameters:
          query: {}
          header:
            x-freepik-api-key:
              type: apiKey
              description: >
                Your Freepik API key. Required for authentication. [Learn how to
                obtain an API
                key](https://docs.freepik.com/authentication#obtaining-an-api-key)
          cookie: {}
    parameters:
      path: {}
      query: {}
      header: {}
      cookie: {}
    body:
      application/json:
        schemaArray:
          - type: object
            properties:
              prompt:
                allOf:
                  - description: Prompt describing the video to generate
                    type: string
              resolution:
                allOf:
                  - $ref: '#/components/schemas/resolution'
              duration:
                allOf:
                  - description: >-
                      The duration of the generated video in seconds. 8s videos
                      cost double. 1080p videos are limited to 5 seconds
                    enum:
                      - 5
                      - 8
                    type: integer
              negative_prompt:
                allOf:
                  - default: ''
                    description: Negative prompt to be used for the generation
                    type: string
              style:
                allOf:
                  - $ref: '#/components/schemas/style-enum'
              seed:
                allOf:
                  - description: >-
                      The same seed and the same prompt given to the same
                      version of the model will output the same video every time
                    type: integer
              image_url:
                allOf:
                  - description: URL of the image to use as the first frame
                    format: uri
                    type: string
              webhook_url:
                allOf:
                  - description: >
                      Optional callback URL that will receive asynchronous
                      notifications whenever the task changes status. The
                      payload sent to this URL is the same as the corresponding
                      GET endpoint response, but without the data field.
                    example: https://www.example.com/webhook
                    format: uri
                    type: string
            required: true
            refIdentifier: '#/components/schemas/request_1'
            requiredProperties:
              - image_url
              - prompt
        examples:
          example:
            value:
              prompt: <string>
              resolution: 360p
              duration: 5
              negative_prompt: ''
              style: anime
              seed: 123
              image_url: <string>
              webhook_url: https://www.example.com/webhook
  response:
    '200':
      application/json:
        schemaArray:
          - type: object
            properties:
              data:
                allOf:
                  - $ref: '#/components/schemas/task-detail'
            refIdentifier: '#/components/schemas/get_style_transfer_task_status_200_response'
            requiredProperties:
              - data
            example:
              data:
                generated:
                  - https://openapi-generator.tech
                  - https://openapi-generator.tech
                task_id: 046b6c7f-0b8a-43b9-b35d-6489e6daee91
                status: CREATED
        examples:
          success - in progress task:
            summary: Success - Task in progress
            value:
              data:
                generated: []
                task_id: 046b6c7f-0b8a-43b9-b35d-6489e6daee91
                status: IN_PROGRESS
        description: OK
    '400':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - &ref_0
                    type: string
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_400_response'
            example: &ref_1
              message: message
        examples:
          invalid_page:
            summary: Parameter 'page' is not valid
            value:
              message: Parameter 'page' must be greater than 0
          invalid_query:
            summary: Parameter 'query' is not valid
            value:
              message: Parameter 'query' must not be empty
          invalid_filter:
            summary: Parameter 'filter' is not valid
            value:
              message: Parameter 'filter' is not valid
          generic_bad_request:
            summary: Bad Request
            value:
              message: Parameter ':attribute' is not valid
        description: >-
          Bad Request - The server could not understand the request due to
          invalid syntax.
      application/problem+json:
        schemaArray:
          - type: object
            properties:
              problem:
                allOf:
                  - $ref: >-
                      #/components/schemas/get_all_style_transfer_tasks_400_response_1_problem
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_400_response_1'
        examples:
          invalid_page:
            summary: Parameter 'page' is not valid
            value:
              message: Your request parameters didn't validate.
              invalid_params:
                - name: page
                  reason: Parameter 'page' must be greater than 0
                - name: per_page
                  reason: Parameter 'per_page' must be greater than 0
        description: >-
          Bad Request - The server could not understand the request due to
          invalid syntax.
    '401':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - *ref_0
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_400_response'
            example: *ref_1
        examples:
          invalid_api_key:
            summary: API key is not valid
            value:
              message: Invalid API key
          missing_api_key:
            summary: API key is not provided
            value:
              message: Missing API key
        description: >-
          Unauthorized - The client must authenticate itself to get the
          requested response.
    '500':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - example: Internal Server Error
                    type: string
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_500_response'
            example:
              message: Internal Server Error
        examples:
          example:
            value:
              message: Internal Server Error
        description: >-
          Internal Server Error - The server has encountered a situation it
          doesn't know how to handle.
    '503':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - example: Service Unavailable. Please try again later.
                    type: string
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_503_response'
            example:
              message: Service Unavailable. Please try again later.
        examples:
          example:
            value:
              message: Service Unavailable. Please try again later.
        description: Service Unavailable
  deprecated: false
  type: path
components:
  schemas:
    task:
      example:
        task_id: 046b6c7f-0b8a-43b9-b35d-6489e6daee91
        status: CREATED
      properties:
        task_id:
          description: Task identifier
          format: uuid
          type: string
        status:
          description: Task status
          enum:
            - CREATED
            - IN_PROGRESS
            - COMPLETED
            - FAILED
          type: string
      required:
        - status
        - task_id
      type: object
    task-detail:
      allOf:
        - $ref: '#/components/schemas/task'
        - properties:
            generated:
              items:
                description: URL of the generated image
                format: uri
                type: string
              type: array
          required:
            - generated
          type: object
      example:
        generated:
          - https://openapi-generator.tech
          - https://openapi-generator.tech
        task_id: 046b6c7f-0b8a-43b9-b35d-6489e6daee91
        status: CREATED
    resolution:
      description: The resolution of the generated video
      enum:
        - 360p
        - 540p
        - 720p
        - 1080p
      type: string
    style-enum:
      description: The style of the generated video
      enum:
        - anime
        - 3d_animation
        - clay
        - cyberpunk
        - comic
      example: anime
      type: string
    get_all_style_transfer_tasks_400_response_1_problem_invalid_params_inner:
      properties:
        name:
          example: page
          type: string
        reason:
          example: Parameter 'page' must be greater than 0
          type: string
      required:
        - name
        - reason
      type: object
    get_all_style_transfer_tasks_400_response_1_problem:
      properties:
        message:
          example: Your request parameters didn't validate.
          type: string
        invalid_params:
          items:
            $ref: >-
              #/components/schemas/get_all_style_transfer_tasks_400_response_1_problem_invalid_params_inner
          type: array
      required:
        - invalid_params
        - message
      type: object

````
# Video transition using PixVerse-V5

> Generate a video transition between two images using the PixVerse-V5 model.

## OpenAPI

````yaml post /v1/ai/image-to-video/pixverse-v5-transition
paths:
  path: /v1/ai/image-to-video/pixverse-v5-transition
  method: post
  servers:
    - url: https://api.freepik.com
      description: B2B API Production V1
  request:
    security:
      - title: apiKey
        parameters:
          query: {}
          header:
            x-freepik-api-key:
              type: apiKey
              description: >
                Your Freepik API key. Required for authentication. [Learn how to
                obtain an API
                key](https://docs.freepik.com/authentication#obtaining-an-api-key)
          cookie: {}
    parameters:
      path: {}
      query: {}
      header: {}
      cookie: {}
    body:
      application/json:
        schemaArray:
          - type: object
            properties:
              prompt:
                allOf:
                  - description: Prompt describing the video transition to generate
                    type: string
              resolution:
                allOf:
                  - $ref: '#/components/schemas/resolution'
              duration:
                allOf:
                  - default: 5
                    description: >-
                      The duration of the generated video in seconds. 8s videos
                      cost double. 1080p videos are limited to 5 seconds
                    enum:
                      - 5
                      - 8
                    type: integer
              negative_prompt:
                allOf:
                  - default: ''
                    description: Negative prompt to be used for the generation
                    type: string
              seed:
                allOf:
                  - description: >-
                      The same seed and the same prompt given to the same
                      version of the model will output the same video every time
                    type: integer
              first_image_url:
                allOf:
                  - description: URL of the image to use as the first frame
                    format: uri
                    type: string
              last_image_url:
                allOf:
                  - description: URL of the image to use as the last frame
                    format: uri
                    type: string
              webhook_url:
                allOf:
                  - description: >
                      Optional callback URL that will receive asynchronous
                      notifications whenever the task changes status. The
                      payload sent to this URL is the same as the corresponding
                      GET endpoint response, but without the data field.
                    example: https://www.example.com/webhook
                    format: uri
                    type: string
            required: true
            refIdentifier: '#/components/schemas/transition-request'
            requiredProperties:
              - first_image_url
              - last_image_url
              - prompt
        examples:
          example:
            value:
              prompt: <string>
              resolution: 360p
              duration: 5
              negative_prompt: ''
              seed: 123
              first_image_url: <string>
              last_image_url: <string>
              webhook_url: https://www.example.com/webhook
  response:
    '200':
      application/json:
        schemaArray:
          - type: object
            properties:
              data:
                allOf:
                  - $ref: '#/components/schemas/task-detail'
            refIdentifier: '#/components/schemas/get_style_transfer_task_status_200_response'
            requiredProperties:
              - data
            example:
              data:
                generated:
                  - https://openapi-generator.tech
                  - https://openapi-generator.tech
                task_id: 046b6c7f-0b8a-43b9-b35d-6489e6daee91
                status: CREATED
        examples:
          success - in progress task:
            summary: Success - Task in progress
            value:
              data:
                generated: []
                task_id: 046b6c7f-0b8a-43b9-b35d-6489e6daee91
                status: IN_PROGRESS
        description: OK
    '400':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - &ref_0
                    type: string
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_400_response'
            example: &ref_1
              message: message
        examples:
          invalid_page:
            summary: Parameter 'page' is not valid
            value:
              message: Parameter 'page' must be greater than 0
          invalid_query:
            summary: Parameter 'query' is not valid
            value:
              message: Parameter 'query' must not be empty
          invalid_filter:
            summary: Parameter 'filter' is not valid
            value:
              message: Parameter 'filter' is not valid
          generic_bad_request:
            summary: Bad Request
            value:
              message: Parameter ':attribute' is not valid
        description: >-
          Bad Request - The server could not understand the request due to
          invalid syntax.
      application/problem+json:
        schemaArray:
          - type: object
            properties:
              problem:
                allOf:
                  - $ref: >-
                      #/components/schemas/get_all_style_transfer_tasks_400_response_1_problem
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_400_response_1'
        examples:
          invalid_page:
            summary: Parameter 'page' is not valid
            value:
              message: Your request parameters didn't validate.
              invalid_params:
                - name: page
                  reason: Parameter 'page' must be greater than 0
                - name: per_page
                  reason: Parameter 'per_page' must be greater than 0
        description: >-
          Bad Request - The server could not understand the request due to
          invalid syntax.
    '401':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - *ref_0
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_400_response'
            example: *ref_1
        examples:
          invalid_api_key:
            summary: API key is not valid
            value:
              message: Invalid API key
          missing_api_key:
            summary: API key is not provided
            value:
              message: Missing API key
        description: >-
          Unauthorized - The client must authenticate itself to get the
          requested response.
    '500':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - example: Internal Server Error
                    type: string
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_500_response'
            example:
              message: Internal Server Error
        examples:
          example:
            value:
              message: Internal Server Error
        description: >-
          Internal Server Error - The server has encountered a situation it
          doesn't know how to handle.
    '503':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - example: Service Unavailable. Please try again later.
                    type: string
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_503_response'
            example:
              message: Service Unavailable. Please try again later.
        examples:
          example:
            value:
              message: Service Unavailable. Please try again later.
        description: Service Unavailable
  deprecated: false
  type: path
components:
  schemas:
    task:
      example:
        task_id: 046b6c7f-0b8a-43b9-b35d-6489e6daee91
        status: CREATED
      properties:
        task_id:
          description: Task identifier
          format: uuid
          type: string
        status:
          description: Task status
          enum:
            - CREATED
            - IN_PROGRESS
            - COMPLETED
            - FAILED
          type: string
      required:
        - status
        - task_id
      type: object
    task-detail:
      allOf:
        - $ref: '#/components/schemas/task'
        - properties:
            generated:
              items:
                description: URL of the generated image
                format: uri
                type: string
              type: array
          required:
            - generated
          type: object
      example:
        generated:
          - https://openapi-generator.tech
          - https://openapi-generator.tech
        task_id: 046b6c7f-0b8a-43b9-b35d-6489e6daee91
        status: CREATED
    resolution:
      description: The resolution of the generated video
      enum:
        - 360p
        - 540p
        - 720p
        - 1080p
      type: string
    get_all_style_transfer_tasks_400_response_1_problem_invalid_params_inner:
      properties:
        name:
          example: page
          type: string
        reason:
          example: Parameter 'page' must be greater than 0
          type: string
      required:
        - name
        - reason
      type: object
    get_all_style_transfer_tasks_400_response_1_problem:
      properties:
        message:
          example: Your request parameters didn't validate.
          type: string
        invalid_params:
          items:
            $ref: >-
              #/components/schemas/get_all_style_transfer_tasks_400_response_1_problem_invalid_params_inner
          type: array
      required:
        - invalid_params
        - message
      type: object

````
# Create a video from an image - Kling 2.1 standard model

> Generate a video from an image using the Kling 2.1 Std model.

## OpenAPI

````yaml post /v1/ai/image-to-video/kling-v2-1-std
paths:
  path: /v1/ai/image-to-video/kling-v2-1-std
  method: post
  servers:
    - url: https://api.freepik.com
      description: B2B API Production V1
  request:
    security:
      - title: apiKey
        parameters:
          query: {}
          header:
            x-freepik-api-key:
              type: apiKey
              description: >
                Your Freepik API key. Required for authentication. [Learn how to
                obtain an API
                key](https://docs.freepik.com/authentication#obtaining-an-api-key)
          cookie: {}
    parameters:
      path: {}
      query: {}
      header: {}
      cookie: {}
    body:
      application/json:
        schemaArray:
          - type: object
            properties:
              webhook_url:
                allOf:
                  - description: >
                      Optional callback URL that will receive asynchronous
                      notifications whenever the task changes status. The
                      payload sent to this URL is the same as the corresponding
                      GET endpoint response, but without the data field.
                    example: https://www.example.com/webhook
                    format: uri
                    type: string
              image:
                allOf:
                  - description: >-
                      Reference Image. Supports Base64 encoding or URL (ensure
                      accessibility). For URL, must be publicly accessible. The
                      image file size cannot exceed 10MB, and the resolution
                      should not be less than 300x300px. Aspect ratio should be
                      between 1:2.5 ~ 2.5:1.
                    type: string
              prompt:
                allOf:
                  - description: >-
                      (`Required when image is not provided`) Text prompt
                      describing the desired motion, cannot exceed 2500
                      characters
                    type: string
              negative_prompt:
                allOf:
                  - description: >-
                      Text prompt describing what to avoid in the generated
                      video, cannot exceed 2500 characters
                    type: string
              duration:
                allOf:
                  - description: Duration of the generated video in seconds
                    enum:
                      - '5'
                      - '10'
                    type: string
              cfg_scale:
                allOf:
                  - default: 0.5
                    description: >-
                      Flexibility in video generation; The higher the value, the
                      lower the model's degree of flexibility, and the stronger
                      the relevance to the user's prompt.
                    format: float
                    maximum: 1
                    minimum: 0
                    type: number
              static_mask:
                allOf:
                  - description: >-
                      Static mask image for defining motion brush application
                      areas.


                      ● Supports both Base64 encoding and image URLs (ensure
                      URLs are publicly accessible and follow the same format
                      requirements as the `image` field).

                      ● Supported image formats include .jpg / .jpeg / .png.

                      ● The aspect ratio of the mask image MUST match the input
                      image (`image` field); otherwise, the task will fail.

                      ● The resolutions of the `static_mask` image and the
                      `dynamic_masks.mask` images must be identical; otherwise,
                      the task will fail.

                      ● The static brush feature allows you to define areas
                      where motion will be applied in the generated video.
                    type: string
              dynamic_masks:
                allOf:
                  - items:
                      $ref: >-
                        #/components/schemas/itvkp_request_content_dynamic_masks_inner
                    type: array
            required: true
            title: Image to Video
            refIdentifier: '#/components/schemas/itvkv2-1-request-content'
            requiredProperties:
              - duration
        examples:
          example:
            value:
              webhook_url: https://www.example.com/webhook
              image: <string>
              prompt: <string>
              negative_prompt: <string>
              duration: '5'
              cfg_scale: 0.5
              static_mask: <string>
              dynamic_masks:
                - mask: <string>
                  trajectories:
                    - x: 123
                      'y': 123
  response:
    '200':
      application/json:
        schemaArray:
          - type: object
            properties:
              data:
                allOf:
                  - $ref: '#/components/schemas/task'
            refIdentifier: '#/components/schemas/create_image_from_text_flux_200_response'
            requiredProperties:
              - data
            example:
              data:
                task_id: 046b6c7f-0b8a-43b9-b35d-6489e6daee91
                status: CREATED
        examples:
          example:
            value:
              data:
                task_id: 046b6c7f-0b8a-43b9-b35d-6489e6daee91
                status: CREATED
        description: OK - Get the status of the kling-std task
    '400':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - &ref_0
                    type: string
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_400_response'
            example: &ref_1
              message: message
        examples:
          invalid_page:
            summary: Parameter 'page' is not valid
            value:
              message: Parameter 'page' must be greater than 0
          invalid_query:
            summary: Parameter 'query' is not valid
            value:
              message: Parameter 'query' must not be empty
          invalid_filter:
            summary: Parameter 'filter' is not valid
            value:
              message: Parameter 'filter' is not valid
          generic_bad_request:
            summary: Bad Request
            value:
              message: Parameter ':attribute' is not valid
        description: >-
          Bad Request - The server could not understand the request due to
          invalid syntax.
      application/problem+json:
        schemaArray:
          - type: object
            properties:
              problem:
                allOf:
                  - $ref: >-
                      #/components/schemas/get_all_style_transfer_tasks_400_response_1_problem
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_400_response_1'
        examples:
          invalid_page:
            summary: Parameter 'page' is not valid
            value:
              message: Your request parameters didn't validate.
              invalid_params:
                - name: page
                  reason: Parameter 'page' must be greater than 0
                - name: per_page
                  reason: Parameter 'per_page' must be greater than 0
        description: >-
          Bad Request - The server could not understand the request due to
          invalid syntax.
    '401':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - *ref_0
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_400_response'
            example: *ref_1
        examples:
          invalid_api_key:
            summary: API key is not valid
            value:
              message: Invalid API key
          missing_api_key:
            summary: API key is not provided
            value:
              message: Missing API key
        description: >-
          Unauthorized - The client must authenticate itself to get the
          requested response.
    '500':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - example: Internal Server Error
                    type: string
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_500_response'
            example:
              message: Internal Server Error
        examples:
          example:
            value:
              message: Internal Server Error
        description: >-
          Internal Server Error - The server has encountered a situation it
          doesn't know how to handle.
    '503':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - example: Service Unavailable. Please try again later.
                    type: string
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_503_response'
            example:
              message: Service Unavailable. Please try again later.
        examples:
          example:
            value:
              message: Service Unavailable. Please try again later.
        description: Service Unavailable
  deprecated: false
  type: path
components:
  schemas:
    task:
      example:
        task_id: 046b6c7f-0b8a-43b9-b35d-6489e6daee91
        status: CREATED
      properties:
        task_id:
          description: Task identifier
          format: uuid
          type: string
        status:
          description: Task status
          enum:
            - CREATED
            - IN_PROGRESS
            - COMPLETED
            - FAILED
          type: string
      required:
        - status
        - task_id
      type: object
    get_all_style_transfer_tasks_400_response_1_problem_invalid_params_inner:
      properties:
        name:
          example: page
          type: string
        reason:
          example: Parameter 'page' must be greater than 0
          type: string
      required:
        - name
        - reason
      type: object
    get_all_style_transfer_tasks_400_response_1_problem:
      properties:
        message:
          example: Your request parameters didn't validate.
          type: string
        invalid_params:
          items:
            $ref: >-
              #/components/schemas/get_all_style_transfer_tasks_400_response_1_problem_invalid_params_inner
          type: array
      required:
        - invalid_params
        - message
      type: object
    itvkp_request_content_dynamic_masks_inner_trajectories_inner:
      properties:
        x:
          description: Horizontal coordinate (X-coordinate) in 2D pixel system.
          type: integer
        'y':
          description: Vertical coordinate (Y-coordinate) in 2D pixel system.
          type: integer
      required:
        - x
        - 'y'
      type: object
    itvkp_request_content_dynamic_masks_inner:
      properties:
        mask:
          description: >-
            Dynamic mask image for defining motion brush application areas with
            trajectories.


            ● Support inputting image Base64 encoding or image URL (ensure the
            URL is accessible and follows the same format requirements as the
            image field).

            ● Supported image formats include .jpg / .jpeg / .png

            ● The aspect ratio of the mask image must match the input image
            (image field); otherwise, the task will fail (failed).

            ● The resolutions of the static_mask image and the
            dynamic_masks.mask image must be identical; otherwise, the task will
            fail (failed).
          type: string
        trajectories:
          description: Motion Trajectory Coordinate Sequence
          items:
            $ref: >-
              #/components/schemas/itvkp_request_content_dynamic_masks_inner_trajectories_inner
          type: array
      required:
        - mask
        - trajectories
      type: object

````
# Create a video from image - Seedance Pro 1080p

> Generate a video from image using the Seedance Pro 1080p model.

## OpenAPI

````yaml post /v1/ai/image-to-video/seedance-pro-1080p
paths:
  path: /v1/ai/image-to-video/seedance-pro-1080p
  method: post
  servers:
    - url: https://api.freepik.com
      description: B2B API Production V1
  request:
    security:
      - title: apiKey
        parameters:
          query: {}
          header:
            x-freepik-api-key:
              type: apiKey
              description: >
                Your Freepik API key. Required for authentication. [Learn how to
                obtain an API
                key](https://docs.freepik.com/authentication#obtaining-an-api-key)
          cookie: {}
    parameters:
      path: {}
      query: {}
      header: {}
      cookie: {}
    body:
      application/json:
        schemaArray:
          - type: object
            properties:
              webhook_url:
                allOf:
                  - description: >
                      Optional callback URL that will receive asynchronous
                      notifications whenever the task changes status. The
                      payload sent to this URL is the same as the corresponding
                      GET endpoint response, but without the data field.
                    example: https://www.example.com/webhook
                    format: uri
                    type: string
              image:
                allOf:
                  - description: >-
                      The image to use for the video generation. Supported
                      formats: URL of the image or base64 encoding of the image.
                    example: >-
                      https://img.freepik.com/free-photo/beautiful-girl-dancing_123456-7890.jpg
                    type: string
              prompt:
                allOf:
                  - description: >-
                      The text content used for the video generation. This is
                      the main description of the video to be generated.
                    example: >-
                      A beautiful girl opens her eyes and smiles warmly, the
                      camera gently zooms in capturing the sparkle in her eyes,
                      soft natural lighting
                    maxLength: 2000
                    type: string
              duration:
                allOf:
                  - default: '5'
                    description: Video duration in seconds
                    enum:
                      - '5'
                      - '10'
                    example: '5'
                    type: string
              camera_fixed:
                allOf:
                  - default: false
                    description: Whether the camera position should be fixed
                    example: false
                    type: boolean
              aspect_ratio:
                allOf:
                  - $ref: '#/components/schemas/seedance-aspect-ratio'
              frames_per_second:
                allOf:
                  - default: 24
                    description: Frames per second for the video
                    enum:
                      - 24
                    example: 24
                    type: integer
              seed:
                allOf:
                  - default: -1
                    description: Random seed for video generation. Use -1 for random seed.
                    example: 69
                    maximum: 4294967295
                    minimum: -1
                    type: integer
            required: true
            title: Image to Video - Seedance Pro 1080p
            refIdentifier: '#/components/schemas/seedance-base'
            requiredProperties:
              - prompt
        examples:
          example:
            value:
              webhook_url: https://www.example.com/webhook
              image: >-
                https://img.freepik.com/free-photo/beautiful-girl-dancing_123456-7890.jpg
              prompt: >-
                A beautiful girl opens her eyes and smiles warmly, the camera
                gently zooms in capturing the sparkle in her eyes, soft natural
                lighting
              duration: '5'
              camera_fixed: false
              aspect_ratio: widescreen_16_9
              frames_per_second: 24
              seed: 69
  response:
    '200':
      application/json:
        schemaArray:
          - type: object
            properties:
              data:
                allOf:
                  - $ref: '#/components/schemas/task'
            refIdentifier: '#/components/schemas/create_image_from_text_flux_200_response'
            requiredProperties:
              - data
            example:
              data:
                task_id: 046b6c7f-0b8a-43b9-b35d-6489e6daee91
                status: CREATED
        examples:
          example:
            value:
              data:
                task_id: 046b6c7f-0b8a-43b9-b35d-6489e6daee91
                status: CREATED
        description: OK - Task created successfully
    '400':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - &ref_0
                    type: string
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_400_response'
            example: &ref_1
              message: message
        examples:
          invalid_page:
            summary: Parameter 'page' is not valid
            value:
              message: Parameter 'page' must be greater than 0
          invalid_query:
            summary: Parameter 'query' is not valid
            value:
              message: Parameter 'query' must not be empty
          invalid_filter:
            summary: Parameter 'filter' is not valid
            value:
              message: Parameter 'filter' is not valid
          generic_bad_request:
            summary: Bad Request
            value:
              message: Parameter ':attribute' is not valid
        description: >-
          Bad Request - The server could not understand the request due to
          invalid syntax.
      application/problem+json:
        schemaArray:
          - type: object
            properties:
              problem:
                allOf:
                  - $ref: >-
                      #/components/schemas/get_all_style_transfer_tasks_400_response_1_problem
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_400_response_1'
        examples:
          invalid_page:
            summary: Parameter 'page' is not valid
            value:
              message: Your request parameters didn't validate.
              invalid_params:
                - name: page
                  reason: Parameter 'page' must be greater than 0
                - name: per_page
                  reason: Parameter 'per_page' must be greater than 0
        description: >-
          Bad Request - The server could not understand the request due to
          invalid syntax.
    '401':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - *ref_0
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_400_response'
            example: *ref_1
        examples:
          invalid_api_key:
            summary: API key is not valid
            value:
              message: Invalid API key
          missing_api_key:
            summary: API key is not provided
            value:
              message: Missing API key
        description: >-
          Unauthorized - The client must authenticate itself to get the
          requested response.
    '500':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - example: Internal Server Error
                    type: string
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_500_response'
            example:
              message: Internal Server Error
        examples:
          example:
            value:
              message: Internal Server Error
        description: >-
          Internal Server Error - The server has encountered a situation it
          doesn't know how to handle.
    '503':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - example: Service Unavailable. Please try again later.
                    type: string
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_503_response'
            example:
              message: Service Unavailable. Please try again later.
        examples:
          example:
            value:
              message: Service Unavailable. Please try again later.
        description: Service Unavailable
  deprecated: false
  type: path
components:
  schemas:
    task:
      example:
        task_id: 046b6c7f-0b8a-43b9-b35d-6489e6daee91
        status: CREATED
      properties:
        task_id:
          description: Task identifier
          format: uuid
          type: string
        status:
          description: Task status
          enum:
            - CREATED
            - IN_PROGRESS
            - COMPLETED
            - FAILED
          type: string
      required:
        - status
        - task_id
      type: object
    seedance-aspect-ratio:
      default: widescreen_16_9
      description: >-
        Video aspect ratio. `(If image is provided, the aspect ratio will be
        automatically detected from the image.)`
      enum:
        - film_horizontal_21_9
        - widescreen_16_9
        - classic_4_3
        - square_1_1
        - traditional_3_4
        - social_story_9_16
        - film_vertical_9_21
      example: widescreen_16_9
      type: string
    get_all_style_transfer_tasks_400_response_1_problem_invalid_params_inner:
      properties:
        name:
          example: page
          type: string
        reason:
          example: Parameter 'page' must be greater than 0
          type: string
      required:
        - name
        - reason
      type: object
    get_all_style_transfer_tasks_400_response_1_problem:
      properties:
        message:
          example: Your request parameters didn't validate.
          type: string
        invalid_params:
          items:
            $ref: >-
              #/components/schemas/get_all_style_transfer_tasks_400_response_1_problem_invalid_params_inner
          type: array
      required:
        - invalid_params
        - message
      type: object

````
# Create a video from image - Seedance Pro 720p

> Generate a video from image using the Seedance Pro 720p model.

## OpenAPI

````yaml post /v1/ai/image-to-video/seedance-pro-720p
paths:
  path: /v1/ai/image-to-video/seedance-pro-720p
  method: post
  servers:
    - url: https://api.freepik.com
      description: B2B API Production V1
  request:
    security:
      - title: apiKey
        parameters:
          query: {}
          header:
            x-freepik-api-key:
              type: apiKey
              description: >
                Your Freepik API key. Required for authentication. [Learn how to
                obtain an API
                key](https://docs.freepik.com/authentication#obtaining-an-api-key)
          cookie: {}
    parameters:
      path: {}
      query: {}
      header: {}
      cookie: {}
    body:
      application/json:
        schemaArray:
          - type: object
            properties:
              webhook_url:
                allOf:
                  - description: >
                      Optional callback URL that will receive asynchronous
                      notifications whenever the task changes status. The
                      payload sent to this URL is the same as the corresponding
                      GET endpoint response, but without the data field.
                    example: https://www.example.com/webhook
                    format: uri
                    type: string
              image:
                allOf:
                  - description: >-
                      The image to use for the video generation. Supported
                      formats: URL of the image or base64 encoding of the image.
                    example: >-
                      https://img.freepik.com/free-photo/beautiful-girl-dancing_123456-7890.jpg
                    type: string
              prompt:
                allOf:
                  - description: >-
                      The text content used for the video generation. This is
                      the main description of the video to be generated.
                    example: >-
                      A beautiful girl opens her eyes and smiles warmly, the
                      camera gently zooms in capturing the sparkle in her eyes,
                      soft natural lighting
                    maxLength: 2000
                    type: string
              duration:
                allOf:
                  - default: '5'
                    description: Video duration in seconds
                    enum:
                      - '5'
                      - '10'
                    example: '5'
                    type: string
              camera_fixed:
                allOf:
                  - default: false
                    description: Whether the camera position should be fixed
                    example: false
                    type: boolean
              aspect_ratio:
                allOf:
                  - $ref: '#/components/schemas/seedance-aspect-ratio'
              frames_per_second:
                allOf:
                  - default: 24
                    description: Frames per second for the video
                    enum:
                      - 24
                    example: 24
                    type: integer
              seed:
                allOf:
                  - default: -1
                    description: Random seed for video generation. Use -1 for random seed.
                    example: 69
                    maximum: 4294967295
                    minimum: -1
                    type: integer
            required: true
            title: Image to Video - Seedance Pro 720p
            refIdentifier: '#/components/schemas/seedance-base'
            requiredProperties:
              - prompt
        examples:
          example:
            value:
              webhook_url: https://www.example.com/webhook
              image: >-
                https://img.freepik.com/free-photo/beautiful-girl-dancing_123456-7890.jpg
              prompt: >-
                A beautiful girl opens her eyes and smiles warmly, the camera
                gently zooms in capturing the sparkle in her eyes, soft natural
                lighting
              duration: '5'
              camera_fixed: false
              aspect_ratio: widescreen_16_9
              frames_per_second: 24
              seed: 69
  response:
    '200':
      application/json:
        schemaArray:
          - type: object
            properties:
              data:
                allOf:
                  - $ref: '#/components/schemas/task'
            refIdentifier: '#/components/schemas/create_image_from_text_flux_200_response'
            requiredProperties:
              - data
            example:
              data:
                task_id: 046b6c7f-0b8a-43b9-b35d-6489e6daee91
                status: CREATED
        examples:
          example:
            value:
              data:
                task_id: 046b6c7f-0b8a-43b9-b35d-6489e6daee91
                status: CREATED
        description: OK - Task created successfully
    '400':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - &ref_0
                    type: string
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_400_response'
            example: &ref_1
              message: message
        examples:
          invalid_page:
            summary: Parameter 'page' is not valid
            value:
              message: Parameter 'page' must be greater than 0
          invalid_query:
            summary: Parameter 'query' is not valid
            value:
              message: Parameter 'query' must not be empty
          invalid_filter:
            summary: Parameter 'filter' is not valid
            value:
              message: Parameter 'filter' is not valid
          generic_bad_request:
            summary: Bad Request
            value:
              message: Parameter ':attribute' is not valid
        description: >-
          Bad Request - The server could not understand the request due to
          invalid syntax.
      application/problem+json:
        schemaArray:
          - type: object
            properties:
              problem:
                allOf:
                  - $ref: >-
                      #/components/schemas/get_all_style_transfer_tasks_400_response_1_problem
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_400_response_1'
        examples:
          invalid_page:
            summary: Parameter 'page' is not valid
            value:
              message: Your request parameters didn't validate.
              invalid_params:
                - name: page
                  reason: Parameter 'page' must be greater than 0
                - name: per_page
                  reason: Parameter 'per_page' must be greater than 0
        description: >-
          Bad Request - The server could not understand the request due to
          invalid syntax.
    '401':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - *ref_0
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_400_response'
            example: *ref_1
        examples:
          invalid_api_key:
            summary: API key is not valid
            value:
              message: Invalid API key
          missing_api_key:
            summary: API key is not provided
            value:
              message: Missing API key
        description: >-
          Unauthorized - The client must authenticate itself to get the
          requested response.
    '500':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - example: Internal Server Error
                    type: string
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_500_response'
            example:
              message: Internal Server Error
        examples:
          example:
            value:
              message: Internal Server Error
        description: >-
          Internal Server Error - The server has encountered a situation it
          doesn't know how to handle.
    '503':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - example: Service Unavailable. Please try again later.
                    type: string
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_503_response'
            example:
              message: Service Unavailable. Please try again later.
        examples:
          example:
            value:
              message: Service Unavailable. Please try again later.
        description: Service Unavailable
  deprecated: false
  type: path
components:
  schemas:
    task:
      example:
        task_id: 046b6c7f-0b8a-43b9-b35d-6489e6daee91
        status: CREATED
      properties:
        task_id:
          description: Task identifier
          format: uuid
          type: string
        status:
          description: Task status
          enum:
            - CREATED
            - IN_PROGRESS
            - COMPLETED
            - FAILED
          type: string
      required:
        - status
        - task_id
      type: object
    seedance-aspect-ratio:
      default: widescreen_16_9
      description: >-
        Video aspect ratio. `(If image is provided, the aspect ratio will be
        automatically detected from the image.)`
      enum:
        - film_horizontal_21_9
        - widescreen_16_9
        - classic_4_3
        - square_1_1
        - traditional_3_4
        - social_story_9_16
        - film_vertical_9_21
      example: widescreen_16_9
      type: string
    get_all_style_transfer_tasks_400_response_1_problem_invalid_params_inner:
      properties:
        name:
          example: page
          type: string
        reason:
          example: Parameter 'page' must be greater than 0
          type: string
      required:
        - name
        - reason
      type: object
    get_all_style_transfer_tasks_400_response_1_problem:
      properties:
        message:
          example: Your request parameters didn't validate.
          type: string
        invalid_params:
          items:
            $ref: >-
              #/components/schemas/get_all_style_transfer_tasks_400_response_1_problem_invalid_params_inner
          type: array
      required:
        - invalid_params
        - message
      type: object

````
# Create a video from image - Seedance Pro 480p

> Generate a video from image using the Seedance Pro 480p model.

## OpenAPI

````yaml post /v1/ai/image-to-video/seedance-pro-480p
paths:
  path: /v1/ai/image-to-video/seedance-pro-480p
  method: post
  servers:
    - url: https://api.freepik.com
      description: B2B API Production V1
  request:
    security:
      - title: apiKey
        parameters:
          query: {}
          header:
            x-freepik-api-key:
              type: apiKey
              description: >
                Your Freepik API key. Required for authentication. [Learn how to
                obtain an API
                key](https://docs.freepik.com/authentication#obtaining-an-api-key)
          cookie: {}
    parameters:
      path: {}
      query: {}
      header: {}
      cookie: {}
    body:
      application/json:
        schemaArray:
          - type: object
            properties:
              webhook_url:
                allOf:
                  - description: >
                      Optional callback URL that will receive asynchronous
                      notifications whenever the task changes status. The
                      payload sent to this URL is the same as the corresponding
                      GET endpoint response, but without the data field.
                    example: https://www.example.com/webhook
                    format: uri
                    type: string
              image:
                allOf:
                  - description: >-
                      The image to use for the video generation. Supported
                      formats: URL of the image or base64 encoding of the image.
                    example: >-
                      https://img.freepik.com/free-photo/beautiful-girl-dancing_123456-7890.jpg
                    type: string
              prompt:
                allOf:
                  - description: >-
                      The text content used for the video generation. This is
                      the main description of the video to be generated.
                    example: >-
                      A beautiful girl opens her eyes and smiles warmly, the
                      camera gently zooms in capturing the sparkle in her eyes,
                      soft natural lighting
                    maxLength: 2000
                    type: string
              duration:
                allOf:
                  - default: '5'
                    description: Video duration in seconds
                    enum:
                      - '5'
                      - '10'
                    example: '5'
                    type: string
              camera_fixed:
                allOf:
                  - default: false
                    description: Whether the camera position should be fixed
                    example: false
                    type: boolean
              aspect_ratio:
                allOf:
                  - $ref: '#/components/schemas/seedance-aspect-ratio'
              frames_per_second:
                allOf:
                  - default: 24
                    description: Frames per second for the video
                    enum:
                      - 24
                    example: 24
                    type: integer
              seed:
                allOf:
                  - default: -1
                    description: Random seed for video generation. Use -1 for random seed.
                    example: 69
                    maximum: 4294967295
                    minimum: -1
                    type: integer
            required: true
            title: Image to Video - Seedance Pro 480p
            refIdentifier: '#/components/schemas/seedance-base'
            requiredProperties:
              - prompt
        examples:
          example:
            value:
              webhook_url: https://www.example.com/webhook
              image: >-
                https://img.freepik.com/free-photo/beautiful-girl-dancing_123456-7890.jpg
              prompt: >-
                A beautiful girl opens her eyes and smiles warmly, the camera
                gently zooms in capturing the sparkle in her eyes, soft natural
                lighting
              duration: '5'
              camera_fixed: false
              aspect_ratio: widescreen_16_9
              frames_per_second: 24
              seed: 69
  response:
    '200':
      application/json:
        schemaArray:
          - type: object
            properties:
              data:
                allOf:
                  - $ref: '#/components/schemas/task'
            refIdentifier: '#/components/schemas/create_image_from_text_flux_200_response'
            requiredProperties:
              - data
            example:
              data:
                task_id: 046b6c7f-0b8a-43b9-b35d-6489e6daee91
                status: CREATED
        examples:
          example:
            value:
              data:
                task_id: 046b6c7f-0b8a-43b9-b35d-6489e6daee91
                status: CREATED
        description: OK - Task created successfully
    '400':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - &ref_0
                    type: string
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_400_response'
            example: &ref_1
              message: message
        examples:
          invalid_page:
            summary: Parameter 'page' is not valid
            value:
              message: Parameter 'page' must be greater than 0
          invalid_query:
            summary: Parameter 'query' is not valid
            value:
              message: Parameter 'query' must not be empty
          invalid_filter:
            summary: Parameter 'filter' is not valid
            value:
              message: Parameter 'filter' is not valid
          generic_bad_request:
            summary: Bad Request
            value:
              message: Parameter ':attribute' is not valid
        description: >-
          Bad Request - The server could not understand the request due to
          invalid syntax.
      application/problem+json:
        schemaArray:
          - type: object
            properties:
              problem:
                allOf:
                  - $ref: >-
                      #/components/schemas/get_all_style_transfer_tasks_400_response_1_problem
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_400_response_1'
        examples:
          invalid_page:
            summary: Parameter 'page' is not valid
            value:
              message: Your request parameters didn't validate.
              invalid_params:
                - name: page
                  reason: Parameter 'page' must be greater than 0
                - name: per_page
                  reason: Parameter 'per_page' must be greater than 0
        description: >-
          Bad Request - The server could not understand the request due to
          invalid syntax.
    '401':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - *ref_0
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_400_response'
            example: *ref_1
        examples:
          invalid_api_key:
            summary: API key is not valid
            value:
              message: Invalid API key
          missing_api_key:
            summary: API key is not provided
            value:
              message: Missing API key
        description: >-
          Unauthorized - The client must authenticate itself to get the
          requested response.
    '500':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - example: Internal Server Error
                    type: string
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_500_response'
            example:
              message: Internal Server Error
        examples:
          example:
            value:
              message: Internal Server Error
        description: >-
          Internal Server Error - The server has encountered a situation it
          doesn't know how to handle.
    '503':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - example: Service Unavailable. Please try again later.
                    type: string
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_503_response'
            example:
              message: Service Unavailable. Please try again later.
        examples:
          example:
            value:
              message: Service Unavailable. Please try again later.
        description: Service Unavailable
  deprecated: false
  type: path
components:
  schemas:
    task:
      example:
        task_id: 046b6c7f-0b8a-43b9-b35d-6489e6daee91
        status: CREATED
      properties:
        task_id:
          description: Task identifier
          format: uuid
          type: string
        status:
          description: Task status
          enum:
            - CREATED
            - IN_PROGRESS
            - COMPLETED
            - FAILED
          type: string
      required:
        - status
        - task_id
      type: object
    seedance-aspect-ratio:
      default: widescreen_16_9
      description: >-
        Video aspect ratio. `(If image is provided, the aspect ratio will be
        automatically detected from the image.)`
      enum:
        - film_horizontal_21_9
        - widescreen_16_9
        - classic_4_3
        - square_1_1
        - traditional_3_4
        - social_story_9_16
        - film_vertical_9_21
      example: widescreen_16_9
      type: string
    get_all_style_transfer_tasks_400_response_1_problem_invalid_params_inner:
      properties:
        name:
          example: page
          type: string
        reason:
          example: Parameter 'page' must be greater than 0
          type: string
      required:
        - name
        - reason
      type: object
    get_all_style_transfer_tasks_400_response_1_problem:
      properties:
        message:
          example: Your request parameters didn't validate.
          type: string
        invalid_params:
          items:
            $ref: >-
              #/components/schemas/get_all_style_transfer_tasks_400_response_1_problem_invalid_params_inner
          type: array
      required:
        - invalid_params
        - message
      type: object

````
# Create a video from image - Seedance Lite 1080p

> Generate a video from image using the Seedance Lite 1080p model.

## OpenAPI

````yaml post /v1/ai/image-to-video/seedance-lite-1080p
paths:
  path: /v1/ai/image-to-video/seedance-lite-1080p
  method: post
  servers:
    - url: https://api.freepik.com
      description: B2B API Production V1
  request:
    security:
      - title: apiKey
        parameters:
          query: {}
          header:
            x-freepik-api-key:
              type: apiKey
              description: >
                Your Freepik API key. Required for authentication. [Learn how to
                obtain an API
                key](https://docs.freepik.com/authentication#obtaining-an-api-key)
          cookie: {}
    parameters:
      path: {}
      query: {}
      header: {}
      cookie: {}
    body:
      application/json:
        schemaArray:
          - type: object
            properties:
              webhook_url:
                allOf:
                  - description: >
                      Optional callback URL that will receive asynchronous
                      notifications whenever the task changes status. The
                      payload sent to this URL is the same as the corresponding
                      GET endpoint response, but without the data field.
                    example: https://www.example.com/webhook
                    format: uri
                    type: string
              image:
                allOf:
                  - description: >-
                      The image to use for the video generation. Supported
                      formats: URL of the image or base64 encoding of the image.
                    example: >-
                      https://img.freepik.com/free-photo/beautiful-girl-dancing_123456-7890.jpg
                    type: string
              prompt:
                allOf:
                  - description: >-
                      The text content used for the video generation. This is
                      the main description of the video to be generated.
                    example: >-
                      A beautiful girl opens her eyes and smiles warmly, the
                      camera gently zooms in capturing the sparkle in her eyes,
                      soft natural lighting
                    maxLength: 2000
                    type: string
              duration:
                allOf:
                  - default: '5'
                    description: Video duration in seconds
                    enum:
                      - '5'
                      - '10'
                    example: '5'
                    type: string
              camera_fixed:
                allOf:
                  - default: false
                    description: Whether the camera position should be fixed
                    example: false
                    type: boolean
              aspect_ratio:
                allOf:
                  - $ref: '#/components/schemas/seedance-aspect-ratio'
              frames_per_second:
                allOf:
                  - default: 24
                    description: Frames per second for the video
                    enum:
                      - 24
                    example: 24
                    type: integer
              seed:
                allOf:
                  - default: -1
                    description: Random seed for video generation. Use -1 for random seed.
                    example: 69
                    maximum: 4294967295
                    minimum: -1
                    type: integer
            required: true
            title: Image to Video - Seedance Lite 1080p
            refIdentifier: '#/components/schemas/seedance-base'
            requiredProperties:
              - prompt
        examples:
          example:
            value:
              webhook_url: https://www.example.com/webhook
              image: >-
                https://img.freepik.com/free-photo/beautiful-girl-dancing_123456-7890.jpg
              prompt: >-
                A beautiful girl opens her eyes and smiles warmly, the camera
                gently zooms in capturing the sparkle in her eyes, soft natural
                lighting
              duration: '5'
              camera_fixed: false
              aspect_ratio: widescreen_16_9
              frames_per_second: 24
              seed: 69
  response:
    '200':
      application/json:
        schemaArray:
          - type: object
            properties:
              data:
                allOf:
                  - $ref: '#/components/schemas/task'
            refIdentifier: '#/components/schemas/create_image_from_text_flux_200_response'
            requiredProperties:
              - data
            example:
              data:
                task_id: 046b6c7f-0b8a-43b9-b35d-6489e6daee91
                status: CREATED
        examples:
          example:
            value:
              data:
                task_id: 046b6c7f-0b8a-43b9-b35d-6489e6daee91
                status: CREATED
        description: OK - Task created successfully
    '400':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - &ref_0
                    type: string
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_400_response'
            example: &ref_1
              message: message
        examples:
          invalid_page:
            summary: Parameter 'page' is not valid
            value:
              message: Parameter 'page' must be greater than 0
          invalid_query:
            summary: Parameter 'query' is not valid
            value:
              message: Parameter 'query' must not be empty
          invalid_filter:
            summary: Parameter 'filter' is not valid
            value:
              message: Parameter 'filter' is not valid
          generic_bad_request:
            summary: Bad Request
            value:
              message: Parameter ':attribute' is not valid
        description: >-
          Bad Request - The server could not understand the request due to
          invalid syntax.
      application/problem+json:
        schemaArray:
          - type: object
            properties:
              problem:
                allOf:
                  - $ref: >-
                      #/components/schemas/get_all_style_transfer_tasks_400_response_1_problem
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_400_response_1'
        examples:
          invalid_page:
            summary: Parameter 'page' is not valid
            value:
              message: Your request parameters didn't validate.
              invalid_params:
                - name: page
                  reason: Parameter 'page' must be greater than 0
                - name: per_page
                  reason: Parameter 'per_page' must be greater than 0
        description: >-
          Bad Request - The server could not understand the request due to
          invalid syntax.
    '401':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - *ref_0
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_400_response'
            example: *ref_1
        examples:
          invalid_api_key:
            summary: API key is not valid
            value:
              message: Invalid API key
          missing_api_key:
            summary: API key is not provided
            value:
              message: Missing API key
        description: >-
          Unauthorized - The client must authenticate itself to get the
          requested response.
    '500':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - example: Internal Server Error
                    type: string
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_500_response'
            example:
              message: Internal Server Error
        examples:
          example:
            value:
              message: Internal Server Error
        description: >-
          Internal Server Error - The server has encountered a situation it
          doesn't know how to handle.
    '503':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - example: Service Unavailable. Please try again later.
                    type: string
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_503_response'
            example:
              message: Service Unavailable. Please try again later.
        examples:
          example:
            value:
              message: Service Unavailable. Please try again later.
        description: Service Unavailable
  deprecated: false
  type: path
components:
  schemas:
    task:
      example:
        task_id: 046b6c7f-0b8a-43b9-b35d-6489e6daee91
        status: CREATED
      properties:
        task_id:
          description: Task identifier
          format: uuid
          type: string
        status:
          description: Task status
          enum:
            - CREATED
            - IN_PROGRESS
            - COMPLETED
            - FAILED
          type: string
      required:
        - status
        - task_id
      type: object
    seedance-aspect-ratio:
      default: widescreen_16_9
      description: >-
        Video aspect ratio. `(If image is provided, the aspect ratio will be
        automatically detected from the image.)`
      enum:
        - film_horizontal_21_9
        - widescreen_16_9
        - classic_4_3
        - square_1_1
        - traditional_3_4
        - social_story_9_16
        - film_vertical_9_21
      example: widescreen_16_9
      type: string
    get_all_style_transfer_tasks_400_response_1_problem_invalid_params_inner:
      properties:
        name:
          example: page
          type: string
        reason:
          example: Parameter 'page' must be greater than 0
          type: string
      required:
        - name
        - reason
      type: object
    get_all_style_transfer_tasks_400_response_1_problem:
      properties:
        message:
          example: Your request parameters didn't validate.
          type: string
        invalid_params:
          items:
            $ref: >-
              #/components/schemas/get_all_style_transfer_tasks_400_response_1_problem_invalid_params_inner
          type: array
      required:
        - invalid_params
        - message
      type: object

````
# Create a video from image - Seedance Lite 720p

> Generate a video from image using the Seedance Lite 720p model.

## OpenAPI

````yaml post /v1/ai/image-to-video/seedance-lite-720p
paths:
  path: /v1/ai/image-to-video/seedance-lite-720p
  method: post
  servers:
    - url: https://api.freepik.com
      description: B2B API Production V1
  request:
    security:
      - title: apiKey
        parameters:
          query: {}
          header:
            x-freepik-api-key:
              type: apiKey
              description: >
                Your Freepik API key. Required for authentication. [Learn how to
                obtain an API
                key](https://docs.freepik.com/authentication#obtaining-an-api-key)
          cookie: {}
    parameters:
      path: {}
      query: {}
      header: {}
      cookie: {}
    body:
      application/json:
        schemaArray:
          - type: object
            properties:
              webhook_url:
                allOf:
                  - description: >
                      Optional callback URL that will receive asynchronous
                      notifications whenever the task changes status. The
                      payload sent to this URL is the same as the corresponding
                      GET endpoint response, but without the data field.
                    example: https://www.example.com/webhook
                    format: uri
                    type: string
              image:
                allOf:
                  - description: >-
                      The image to use for the video generation. Supported
                      formats: URL of the image or base64 encoding of the image.
                    example: >-
                      https://img.freepik.com/free-photo/beautiful-girl-dancing_123456-7890.jpg
                    type: string
              prompt:
                allOf:
                  - description: >-
                      The text content used for the video generation. This is
                      the main description of the video to be generated.
                    example: >-
                      A beautiful girl opens her eyes and smiles warmly, the
                      camera gently zooms in capturing the sparkle in her eyes,
                      soft natural lighting
                    maxLength: 2000
                    type: string
              duration:
                allOf:
                  - default: '5'
                    description: Video duration in seconds
                    enum:
                      - '5'
                      - '10'
                    example: '5'
                    type: string
              camera_fixed:
                allOf:
                  - default: false
                    description: Whether the camera position should be fixed
                    example: false
                    type: boolean
              aspect_ratio:
                allOf:
                  - $ref: '#/components/schemas/seedance-aspect-ratio'
              frames_per_second:
                allOf:
                  - default: 24
                    description: Frames per second for the video
                    enum:
                      - 24
                    example: 24
                    type: integer
              seed:
                allOf:
                  - default: -1
                    description: Random seed for video generation. Use -1 for random seed.
                    example: 69
                    maximum: 4294967295
                    minimum: -1
                    type: integer
            required: true
            title: Image to Video - Seedance Lite 720p
            refIdentifier: '#/components/schemas/seedance-base'
            requiredProperties:
              - prompt
        examples:
          example:
            value:
              webhook_url: https://www.example.com/webhook
              image: >-
                https://img.freepik.com/free-photo/beautiful-girl-dancing_123456-7890.jpg
              prompt: >-
                A beautiful girl opens her eyes and smiles warmly, the camera
                gently zooms in capturing the sparkle in her eyes, soft natural
                lighting
              duration: '5'
              camera_fixed: false
              aspect_ratio: widescreen_16_9
              frames_per_second: 24
              seed: 69
  response:
    '200':
      application/json:
        schemaArray:
          - type: object
            properties:
              data:
                allOf:
                  - $ref: '#/components/schemas/task'
            refIdentifier: '#/components/schemas/create_image_from_text_flux_200_response'
            requiredProperties:
              - data
            example:
              data:
                task_id: 046b6c7f-0b8a-43b9-b35d-6489e6daee91
                status: CREATED
        examples:
          example:
            value:
              data:
                task_id: 046b6c7f-0b8a-43b9-b35d-6489e6daee91
                status: CREATED
        description: OK - Task created successfully
    '400':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - &ref_0
                    type: string
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_400_response'
            example: &ref_1
              message: message
        examples:
          invalid_page:
            summary: Parameter 'page' is not valid
            value:
              message: Parameter 'page' must be greater than 0
          invalid_query:
            summary: Parameter 'query' is not valid
            value:
              message: Parameter 'query' must not be empty
          invalid_filter:
            summary: Parameter 'filter' is not valid
            value:
              message: Parameter 'filter' is not valid
          generic_bad_request:
            summary: Bad Request
            value:
              message: Parameter ':attribute' is not valid
        description: >-
          Bad Request - The server could not understand the request due to
          invalid syntax.
      application/problem+json:
        schemaArray:
          - type: object
            properties:
              problem:
                allOf:
                  - $ref: >-
                      #/components/schemas/get_all_style_transfer_tasks_400_response_1_problem
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_400_response_1'
        examples:
          invalid_page:
            summary: Parameter 'page' is not valid
            value:
              message: Your request parameters didn't validate.
              invalid_params:
                - name: page
                  reason: Parameter 'page' must be greater than 0
                - name: per_page
                  reason: Parameter 'per_page' must be greater than 0
        description: >-
          Bad Request - The server could not understand the request due to
          invalid syntax.
    '401':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - *ref_0
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_400_response'
            example: *ref_1
        examples:
          invalid_api_key:
            summary: API key is not valid
            value:
              message: Invalid API key
          missing_api_key:
            summary: API key is not provided
            value:
              message: Missing API key
        description: >-
          Unauthorized - The client must authenticate itself to get the
          requested response.
    '500':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - example: Internal Server Error
                    type: string
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_500_response'
            example:
              message: Internal Server Error
        examples:
          example:
            value:
              message: Internal Server Error
        description: >-
          Internal Server Error - The server has encountered a situation it
          doesn't know how to handle.
    '503':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - example: Service Unavailable. Please try again later.
                    type: string
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_503_response'
            example:
              message: Service Unavailable. Please try again later.
        examples:
          example:
            value:
              message: Service Unavailable. Please try again later.
        description: Service Unavailable
  deprecated: false
  type: path
components:
  schemas:
    task:
      example:
        task_id: 046b6c7f-0b8a-43b9-b35d-6489e6daee91
        status: CREATED
      properties:
        task_id:
          description: Task identifier
          format: uuid
          type: string
        status:
          description: Task status
          enum:
            - CREATED
            - IN_PROGRESS
            - COMPLETED
            - FAILED
          type: string
      required:
        - status
        - task_id
      type: object
    seedance-aspect-ratio:
      default: widescreen_16_9
      description: >-
        Video aspect ratio. `(If image is provided, the aspect ratio will be
        automatically detected from the image.)`
      enum:
        - film_horizontal_21_9
        - widescreen_16_9
        - classic_4_3
        - square_1_1
        - traditional_3_4
        - social_story_9_16
        - film_vertical_9_21
      example: widescreen_16_9
      type: string
    get_all_style_transfer_tasks_400_response_1_problem_invalid_params_inner:
      properties:
        name:
          example: page
          type: string
        reason:
          example: Parameter 'page' must be greater than 0
          type: string
      required:
        - name
        - reason
      type: object
    get_all_style_transfer_tasks_400_response_1_problem:
      properties:
        message:
          example: Your request parameters didn't validate.
          type: string
        invalid_params:
          items:
            $ref: >-
              #/components/schemas/get_all_style_transfer_tasks_400_response_1_problem_invalid_params_inner
          type: array
      required:
        - invalid_params
        - message
      type: object

````
# Create a video from image - Seedance Lite 480p

> Generate a video from image using the Seedance Lite 480p model.

## OpenAPI

````yaml post /v1/ai/image-to-video/seedance-lite-480p
paths:
  path: /v1/ai/image-to-video/seedance-lite-480p
  method: post
  servers:
    - url: https://api.freepik.com
      description: B2B API Production V1
  request:
    security:
      - title: apiKey
        parameters:
          query: {}
          header:
            x-freepik-api-key:
              type: apiKey
              description: >
                Your Freepik API key. Required for authentication. [Learn how to
                obtain an API
                key](https://docs.freepik.com/authentication#obtaining-an-api-key)
          cookie: {}
    parameters:
      path: {}
      query: {}
      header: {}
      cookie: {}
    body:
      application/json:
        schemaArray:
          - type: object
            properties:
              webhook_url:
                allOf:
                  - description: >
                      Optional callback URL that will receive asynchronous
                      notifications whenever the task changes status. The
                      payload sent to this URL is the same as the corresponding
                      GET endpoint response, but without the data field.
                    example: https://www.example.com/webhook
                    format: uri
                    type: string
              image:
                allOf:
                  - description: >-
                      The image to use for the video generation. Supported
                      formats: URL of the image or base64 encoding of the image.
                    example: >-
                      https://img.freepik.com/free-photo/beautiful-girl-dancing_123456-7890.jpg
                    type: string
              prompt:
                allOf:
                  - description: >-
                      The text content used for the video generation. This is
                      the main description of the video to be generated.
                    example: >-
                      A beautiful girl opens her eyes and smiles warmly, the
                      camera gently zooms in capturing the sparkle in her eyes,
                      soft natural lighting
                    maxLength: 2000
                    type: string
              duration:
                allOf:
                  - default: '5'
                    description: Video duration in seconds
                    enum:
                      - '5'
                      - '10'
                    example: '5'
                    type: string
              camera_fixed:
                allOf:
                  - default: false
                    description: Whether the camera position should be fixed
                    example: false
                    type: boolean
              aspect_ratio:
                allOf:
                  - $ref: '#/components/schemas/seedance-aspect-ratio'
              frames_per_second:
                allOf:
                  - default: 24
                    description: Frames per second for the video
                    enum:
                      - 24
                    example: 24
                    type: integer
              seed:
                allOf:
                  - default: -1
                    description: Random seed for video generation. Use -1 for random seed.
                    example: 69
                    maximum: 4294967295
                    minimum: -1
                    type: integer
            required: true
            title: Image to Video - Seedance Lite 480p
            refIdentifier: '#/components/schemas/seedance-base'
            requiredProperties:
              - prompt
        examples:
          example:
            value:
              webhook_url: https://www.example.com/webhook
              image: >-
                https://img.freepik.com/free-photo/beautiful-girl-dancing_123456-7890.jpg
              prompt: >-
                A beautiful girl opens her eyes and smiles warmly, the camera
                gently zooms in capturing the sparkle in her eyes, soft natural
                lighting
              duration: '5'
              camera_fixed: false
              aspect_ratio: widescreen_16_9
              frames_per_second: 24
              seed: 69
  response:
    '200':
      application/json:
        schemaArray:
          - type: object
            properties:
              data:
                allOf:
                  - $ref: '#/components/schemas/task'
            refIdentifier: '#/components/schemas/create_image_from_text_flux_200_response'
            requiredProperties:
              - data
            example:
              data:
                task_id: 046b6c7f-0b8a-43b9-b35d-6489e6daee91
                status: CREATED
        examples:
          example:
            value:
              data:
                task_id: 046b6c7f-0b8a-43b9-b35d-6489e6daee91
                status: CREATED
        description: OK - Task created successfully
    '400':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - &ref_0
                    type: string
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_400_response'
            example: &ref_1
              message: message
        examples:
          invalid_page:
            summary: Parameter 'page' is not valid
            value:
              message: Parameter 'page' must be greater than 0
          invalid_query:
            summary: Parameter 'query' is not valid
            value:
              message: Parameter 'query' must not be empty
          invalid_filter:
            summary: Parameter 'filter' is not valid
            value:
              message: Parameter 'filter' is not valid
          generic_bad_request:
            summary: Bad Request
            value:
              message: Parameter ':attribute' is not valid
        description: >-
          Bad Request - The server could not understand the request due to
          invalid syntax.
      application/problem+json:
        schemaArray:
          - type: object
            properties:
              problem:
                allOf:
                  - $ref: >-
                      #/components/schemas/get_all_style_transfer_tasks_400_response_1_problem
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_400_response_1'
        examples:
          invalid_page:
            summary: Parameter 'page' is not valid
            value:
              message: Your request parameters didn't validate.
              invalid_params:
                - name: page
                  reason: Parameter 'page' must be greater than 0
                - name: per_page
                  reason: Parameter 'per_page' must be greater than 0
        description: >-
          Bad Request - The server could not understand the request due to
          invalid syntax.
    '401':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - *ref_0
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_400_response'
            example: *ref_1
        examples:
          invalid_api_key:
            summary: API key is not valid
            value:
              message: Invalid API key
          missing_api_key:
            summary: API key is not provided
            value:
              message: Missing API key
        description: >-
          Unauthorized - The client must authenticate itself to get the
          requested response.
    '500':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - example: Internal Server Error
                    type: string
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_500_response'
            example:
              message: Internal Server Error
        examples:
          example:
            value:
              message: Internal Server Error
        description: >-
          Internal Server Error - The server has encountered a situation it
          doesn't know how to handle.
    '503':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - example: Service Unavailable. Please try again later.
                    type: string
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_503_response'
            example:
              message: Service Unavailable. Please try again later.
        examples:
          example:
            value:
              message: Service Unavailable. Please try again later.
        description: Service Unavailable
  deprecated: false
  type: path
components:
  schemas:
    task:
      example:
        task_id: 046b6c7f-0b8a-43b9-b35d-6489e6daee91
        status: CREATED
      properties:
        task_id:
          description: Task identifier
          format: uuid
          type: string
        status:
          description: Task status
          enum:
            - CREATED
            - IN_PROGRESS
            - COMPLETED
            - FAILED
          type: string
      required:
        - status
        - task_id
      type: object
    seedance-aspect-ratio:
      default: widescreen_16_9
      description: >-
        Video aspect ratio. `(If image is provided, the aspect ratio will be
        automatically detected from the image.)`
      enum:
        - film_horizontal_21_9
        - widescreen_16_9
        - classic_4_3
        - square_1_1
        - traditional_3_4
        - social_story_9_16
        - film_vertical_9_21
      example: widescreen_16_9
      type: string
    get_all_style_transfer_tasks_400_response_1_problem_invalid_params_inner:
      properties:
        name:
          example: page
          type: string
        reason:
          example: Parameter 'page' must be greater than 0
          type: string
      required:
        - name
        - reason
      type: object
    get_all_style_transfer_tasks_400_response_1_problem:
      properties:
        message:
          example: Your request parameters didn't validate.
          type: string
        invalid_params:
          items:
            $ref: >-
              #/components/schemas/get_all_style_transfer_tasks_400_response_1_problem_invalid_params_inner
          type: array
      required:
        - invalid_params
        - message
      type: object

````
# Create a video from image - Wan v2.2 720p

> Generate a video from image using the Wan v2.2 720p model.

## OpenAPI

````yaml post /v1/ai/image-to-video/wan-v2-2-720p
paths:
  path: /v1/ai/image-to-video/wan-v2-2-720p
  method: post
  servers:
    - url: https://api.freepik.com
      description: B2B API Production V1
  request:
    security:
      - title: apiKey
        parameters:
          query: {}
          header:
            x-freepik-api-key:
              type: apiKey
              description: >
                Your Freepik API key. Required for authentication. [Learn how to
                obtain an API
                key](https://docs.freepik.com/authentication#obtaining-an-api-key)
          cookie: {}
    parameters:
      path: {}
      query: {}
      header: {}
      cookie: {}
    body:
      application/json:
        schemaArray:
          - type: object
            properties:
              webhook_url:
                allOf:
                  - description: >
                      Optional callback URL that will receive asynchronous
                      notifications whenever the task changes status. The
                      payload sent to this URL is the same as the corresponding
                      GET endpoint response, but without the data field.
                    example: https://www.example.com/webhook
                    format: uri
                    type: string
              image:
                allOf:
                  - description: >-
                      The image to use for the video generation. Supported
                      formats: URL of the image or base64 encoding of the image.
                    example: >-
                      https://img.freepik.com/free-photo/beautiful-girl-dancing_123456-7890.jpg
                    type: string
              prompt:
                allOf:
                  - description: >-
                      The text content used for the video generation. This is
                      the main description of the video to be generated.
                    example: >-
                      A beautiful girl opens her eyes and smiles warmly, the
                      camera gently zooms in capturing the sparkle in her eyes,
                      soft natural lighting
                    maxLength: 2000
                    type: string
              duration:
                allOf:
                  - default: '5'
                    description: Video duration in seconds
                    enum:
                      - '5'
                      - '10'
                    example: '5'
                    type: string
              aspect_ratio:
                allOf:
                  - $ref: '#/components/schemas/wan-v22-aspect-ratio'
              seed:
                allOf:
                  - description: Random seed for video generation.
                    example: 70
                    type: integer
            required: true
            title: Image to Video - Wan v2.2 720p
            refIdentifier: '#/components/schemas/wan-v22-base'
            requiredProperties:
              - image
        examples:
          example:
            value:
              webhook_url: https://www.example.com/webhook
              image: >-
                https://img.freepik.com/free-photo/beautiful-girl-dancing_123456-7890.jpg
              prompt: >-
                A beautiful girl opens her eyes and smiles warmly, the camera
                gently zooms in capturing the sparkle in her eyes, soft natural
                lighting
              duration: '5'
              aspect_ratio: auto
              seed: 70
  response:
    '200':
      application/json:
        schemaArray:
          - type: object
            properties:
              data:
                allOf:
                  - $ref: '#/components/schemas/task'
            refIdentifier: '#/components/schemas/create_image_from_text_flux_200_response'
            requiredProperties:
              - data
            example:
              data:
                task_id: 046b6c7f-0b8a-43b9-b35d-6489e6daee91
                status: CREATED
        examples:
          example:
            value:
              data:
                task_id: 046b6c7f-0b8a-43b9-b35d-6489e6daee91
                status: CREATED
        description: OK - Task created successfully
    '400':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - &ref_0
                    type: string
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_400_response'
            example: &ref_1
              message: message
        examples:
          invalid_page:
            summary: Parameter 'page' is not valid
            value:
              message: Parameter 'page' must be greater than 0
          invalid_query:
            summary: Parameter 'query' is not valid
            value:
              message: Parameter 'query' must not be empty
          invalid_filter:
            summary: Parameter 'filter' is not valid
            value:
              message: Parameter 'filter' is not valid
          generic_bad_request:
            summary: Bad Request
            value:
              message: Parameter ':attribute' is not valid
        description: >-
          Bad Request - The server could not understand the request due to
          invalid syntax.
      application/problem+json:
        schemaArray:
          - type: object
            properties:
              problem:
                allOf:
                  - $ref: >-
                      #/components/schemas/get_all_style_transfer_tasks_400_response_1_problem
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_400_response_1'
        examples:
          invalid_page:
            summary: Parameter 'page' is not valid
            value:
              message: Your request parameters didn't validate.
              invalid_params:
                - name: page
                  reason: Parameter 'page' must be greater than 0
                - name: per_page
                  reason: Parameter 'per_page' must be greater than 0
        description: >-
          Bad Request - The server could not understand the request due to
          invalid syntax.
    '401':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - *ref_0
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_400_response'
            example: *ref_1
        examples:
          invalid_api_key:
            summary: API key is not valid
            value:
              message: Invalid API key
          missing_api_key:
            summary: API key is not provided
            value:
              message: Missing API key
        description: >-
          Unauthorized - The client must authenticate itself to get the
          requested response.
    '500':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - example: Internal Server Error
                    type: string
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_500_response'
            example:
              message: Internal Server Error
        examples:
          example:
            value:
              message: Internal Server Error
        description: >-
          Internal Server Error - The server has encountered a situation it
          doesn't know how to handle.
    '503':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - example: Service Unavailable. Please try again later.
                    type: string
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_503_response'
            example:
              message: Service Unavailable. Please try again later.
        examples:
          example:
            value:
              message: Service Unavailable. Please try again later.
        description: Service Unavailable
  deprecated: false
  type: path
components:
  schemas:
    task:
      example:
        task_id: 046b6c7f-0b8a-43b9-b35d-6489e6daee91
        status: CREATED
      properties:
        task_id:
          description: Task identifier
          format: uuid
          type: string
        status:
          description: Task status
          enum:
            - CREATED
            - IN_PROGRESS
            - COMPLETED
            - FAILED
          type: string
      required:
        - status
        - task_id
      type: object
    wan-v22-aspect-ratio:
      default: auto
      description: Video aspect ratio.`
      enum:
        - auto
        - widescreen_16_9
        - social_story_9_16
        - square_1_1
        - classic_4_3
      example: auto
      type: string
    get_all_style_transfer_tasks_400_response_1_problem_invalid_params_inner:
      properties:
        name:
          example: page
          type: string
        reason:
          example: Parameter 'page' must be greater than 0
          type: string
      required:
        - name
        - reason
      type: object
    get_all_style_transfer_tasks_400_response_1_problem:
      properties:
        message:
          example: Your request parameters didn't validate.
          type: string
        invalid_params:
          items:
            $ref: >-
              #/components/schemas/get_all_style_transfer_tasks_400_response_1_problem_invalid_params_inner
          type: array
      required:
        - invalid_params
        - message
      type: object

````
# Create a video from image - Wan v2.2 580p

> Generate a video from image using the Wan v2.2 580p model.

## OpenAPI

````yaml post /v1/ai/image-to-video/wan-v2-2-580p
paths:
  path: /v1/ai/image-to-video/wan-v2-2-580p
  method: post
  servers:
    - url: https://api.freepik.com
      description: B2B API Production V1
  request:
    security:
      - title: apiKey
        parameters:
          query: {}
          header:
            x-freepik-api-key:
              type: apiKey
              description: >
                Your Freepik API key. Required for authentication. [Learn how to
                obtain an API
                key](https://docs.freepik.com/authentication#obtaining-an-api-key)
          cookie: {}
    parameters:
      path: {}
      query: {}
      header: {}
      cookie: {}
    body:
      application/json:
        schemaArray:
          - type: object
            properties:
              webhook_url:
                allOf:
                  - description: >
                      Optional callback URL that will receive asynchronous
                      notifications whenever the task changes status. The
                      payload sent to this URL is the same as the corresponding
                      GET endpoint response, but without the data field.
                    example: https://www.example.com/webhook
                    format: uri
                    type: string
              image:
                allOf:
                  - description: >-
                      The image to use for the video generation. Supported
                      formats: URL of the image or base64 encoding of the image.
                    example: >-
                      https://img.freepik.com/free-photo/beautiful-girl-dancing_123456-7890.jpg
                    type: string
              prompt:
                allOf:
                  - description: >-
                      The text content used for the video generation. This is
                      the main description of the video to be generated.
                    example: >-
                      A beautiful girl opens her eyes and smiles warmly, the
                      camera gently zooms in capturing the sparkle in her eyes,
                      soft natural lighting
                    maxLength: 2000
                    type: string
              duration:
                allOf:
                  - default: '5'
                    description: Video duration in seconds
                    enum:
                      - '5'
                      - '10'
                    example: '5'
                    type: string
              aspect_ratio:
                allOf:
                  - $ref: '#/components/schemas/wan-v22-aspect-ratio'
              seed:
                allOf:
                  - description: Random seed for video generation.
                    example: 70
                    type: integer
            required: true
            title: Image to Video - Wan v2.2 580p
            refIdentifier: '#/components/schemas/wan-v22-base'
            requiredProperties:
              - image
        examples:
          example:
            value:
              webhook_url: https://www.example.com/webhook
              image: >-
                https://img.freepik.com/free-photo/beautiful-girl-dancing_123456-7890.jpg
              prompt: >-
                A beautiful girl opens her eyes and smiles warmly, the camera
                gently zooms in capturing the sparkle in her eyes, soft natural
                lighting
              duration: '5'
              aspect_ratio: auto
              seed: 70
  response:
    '200':
      application/json:
        schemaArray:
          - type: object
            properties:
              data:
                allOf:
                  - $ref: '#/components/schemas/task'
            refIdentifier: '#/components/schemas/create_image_from_text_flux_200_response'
            requiredProperties:
              - data
            example:
              data:
                task_id: 046b6c7f-0b8a-43b9-b35d-6489e6daee91
                status: CREATED
        examples:
          example:
            value:
              data:
                task_id: 046b6c7f-0b8a-43b9-b35d-6489e6daee91
                status: CREATED
        description: OK - Task created successfully
    '400':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - &ref_0
                    type: string
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_400_response'
            example: &ref_1
              message: message
        examples:
          invalid_page:
            summary: Parameter 'page' is not valid
            value:
              message: Parameter 'page' must be greater than 0
          invalid_query:
            summary: Parameter 'query' is not valid
            value:
              message: Parameter 'query' must not be empty
          invalid_filter:
            summary: Parameter 'filter' is not valid
            value:
              message: Parameter 'filter' is not valid
          generic_bad_request:
            summary: Bad Request
            value:
              message: Parameter ':attribute' is not valid
        description: >-
          Bad Request - The server could not understand the request due to
          invalid syntax.
      application/problem+json:
        schemaArray:
          - type: object
            properties:
              problem:
                allOf:
                  - $ref: >-
                      #/components/schemas/get_all_style_transfer_tasks_400_response_1_problem
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_400_response_1'
        examples:
          invalid_page:
            summary: Parameter 'page' is not valid
            value:
              message: Your request parameters didn't validate.
              invalid_params:
                - name: page
                  reason: Parameter 'page' must be greater than 0
                - name: per_page
                  reason: Parameter 'per_page' must be greater than 0
        description: >-
          Bad Request - The server could not understand the request due to
          invalid syntax.
    '401':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - *ref_0
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_400_response'
            example: *ref_1
        examples:
          invalid_api_key:
            summary: API key is not valid
            value:
              message: Invalid API key
          missing_api_key:
            summary: API key is not provided
            value:
              message: Missing API key
        description: >-
          Unauthorized - The client must authenticate itself to get the
          requested response.
    '500':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - example: Internal Server Error
                    type: string
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_500_response'
            example:
              message: Internal Server Error
        examples:
          example:
            value:
              message: Internal Server Error
        description: >-
          Internal Server Error - The server has encountered a situation it
          doesn't know how to handle.
    '503':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - example: Service Unavailable. Please try again later.
                    type: string
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_503_response'
            example:
              message: Service Unavailable. Please try again later.
        examples:
          example:
            value:
              message: Service Unavailable. Please try again later.
        description: Service Unavailable
  deprecated: false
  type: path
components:
  schemas:
    task:
      example:
        task_id: 046b6c7f-0b8a-43b9-b35d-6489e6daee91
        status: CREATED
      properties:
        task_id:
          description: Task identifier
          format: uuid
          type: string
        status:
          description: Task status
          enum:
            - CREATED
            - IN_PROGRESS
            - COMPLETED
            - FAILED
          type: string
      required:
        - status
        - task_id
      type: object
    wan-v22-aspect-ratio:
      default: auto
      description: Video aspect ratio.`
      enum:
        - auto
        - widescreen_16_9
        - social_story_9_16
        - square_1_1
        - classic_4_3
      example: auto
      type: string
    get_all_style_transfer_tasks_400_response_1_problem_invalid_params_inner:
      properties:
        name:
          example: page
          type: string
        reason:
          example: Parameter 'page' must be greater than 0
          type: string
      required:
        - name
        - reason
      type: object
    get_all_style_transfer_tasks_400_response_1_problem:
      properties:
        message:
          example: Your request parameters didn't validate.
          type: string
        invalid_params:
          items:
            $ref: >-
              #/components/schemas/get_all_style_transfer_tasks_400_response_1_problem_invalid_params_inner
          type: array
      required:
        - invalid_params
        - message
      type: object

````
# Create a video from image - Wan v2.2 480p

> Generate a video from image using the Wan v2.2 480p model.

## OpenAPI

````yaml post /v1/ai/image-to-video/wan-v2-2-480p
paths:
  path: /v1/ai/image-to-video/wan-v2-2-480p
  method: post
  servers:
    - url: https://api.freepik.com
      description: B2B API Production V1
  request:
    security:
      - title: apiKey
        parameters:
          query: {}
          header:
            x-freepik-api-key:
              type: apiKey
              description: >
                Your Freepik API key. Required for authentication. [Learn how to
                obtain an API
                key](https://docs.freepik.com/authentication#obtaining-an-api-key)
          cookie: {}
    parameters:
      path: {}
      query: {}
      header: {}
      cookie: {}
    body:
      application/json:
        schemaArray:
          - type: object
            properties:
              webhook_url:
                allOf:
                  - description: >
                      Optional callback URL that will receive asynchronous
                      notifications whenever the task changes status. The
                      payload sent to this URL is the same as the corresponding
                      GET endpoint response, but without the data field.
                    example: https://www.example.com/webhook
                    format: uri
                    type: string
              image:
                allOf:
                  - description: >-
                      The image to use for the video generation. Supported
                      formats: URL of the image or base64 encoding of the image.
                    example: >-
                      https://img.freepik.com/free-photo/beautiful-girl-dancing_123456-7890.jpg
                    type: string
              prompt:
                allOf:
                  - description: >-
                      The text content used for the video generation. This is
                      the main description of the video to be generated.
                    example: >-
                      A beautiful girl opens her eyes and smiles warmly, the
                      camera gently zooms in capturing the sparkle in her eyes,
                      soft natural lighting
                    maxLength: 2000
                    type: string
              duration:
                allOf:
                  - default: '5'
                    description: Video duration in seconds
                    enum:
                      - '5'
                      - '10'
                    example: '5'
                    type: string
              aspect_ratio:
                allOf:
                  - $ref: '#/components/schemas/wan-v22-aspect-ratio'
              seed:
                allOf:
                  - description: Random seed for video generation.
                    example: 70
                    type: integer
            required: true
            title: Image to Video - Wan v2.2 480p
            refIdentifier: '#/components/schemas/wan-v22-base'
            requiredProperties:
              - image
        examples:
          example:
            value:
              webhook_url: https://www.example.com/webhook
              image: >-
                https://img.freepik.com/free-photo/beautiful-girl-dancing_123456-7890.jpg
              prompt: >-
                A beautiful girl opens her eyes and smiles warmly, the camera
                gently zooms in capturing the sparkle in her eyes, soft natural
                lighting
              duration: '5'
              aspect_ratio: auto
              seed: 70
  response:
    '200':
      application/json:
        schemaArray:
          - type: object
            properties:
              data:
                allOf:
                  - $ref: '#/components/schemas/task'
            refIdentifier: '#/components/schemas/create_image_from_text_flux_200_response'
            requiredProperties:
              - data
            example:
              data:
                task_id: 046b6c7f-0b8a-43b9-b35d-6489e6daee91
                status: CREATED
        examples:
          example:
            value:
              data:
                task_id: 046b6c7f-0b8a-43b9-b35d-6489e6daee91
                status: CREATED
        description: OK - Task created successfully
    '400':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - &ref_0
                    type: string
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_400_response'
            example: &ref_1
              message: message
        examples:
          invalid_page:
            summary: Parameter 'page' is not valid
            value:
              message: Parameter 'page' must be greater than 0
          invalid_query:
            summary: Parameter 'query' is not valid
            value:
              message: Parameter 'query' must not be empty
          invalid_filter:
            summary: Parameter 'filter' is not valid
            value:
              message: Parameter 'filter' is not valid
          generic_bad_request:
            summary: Bad Request
            value:
              message: Parameter ':attribute' is not valid
        description: >-
          Bad Request - The server could not understand the request due to
          invalid syntax.
      application/problem+json:
        schemaArray:
          - type: object
            properties:
              problem:
                allOf:
                  - $ref: >-
                      #/components/schemas/get_all_style_transfer_tasks_400_response_1_problem
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_400_response_1'
        examples:
          invalid_page:
            summary: Parameter 'page' is not valid
            value:
              message: Your request parameters didn't validate.
              invalid_params:
                - name: page
                  reason: Parameter 'page' must be greater than 0
                - name: per_page
                  reason: Parameter 'per_page' must be greater than 0
        description: >-
          Bad Request - The server could not understand the request due to
          invalid syntax.
    '401':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - *ref_0
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_400_response'
            example: *ref_1
        examples:
          invalid_api_key:
            summary: API key is not valid
            value:
              message: Invalid API key
          missing_api_key:
            summary: API key is not provided
            value:
              message: Missing API key
        description: >-
          Unauthorized - The client must authenticate itself to get the
          requested response.
    '500':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - example: Internal Server Error
                    type: string
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_500_response'
            example:
              message: Internal Server Error
        examples:
          example:
            value:
              message: Internal Server Error
        description: >-
          Internal Server Error - The server has encountered a situation it
          doesn't know how to handle.
    '503':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - example: Service Unavailable. Please try again later.
                    type: string
            refIdentifier: '#/components/schemas/get_all_style_transfer_tasks_503_response'
            example:
              message: Service Unavailable. Please try again later.
        examples:
          example:
            value:
              message: Service Unavailable. Please try again later.
        description: Service Unavailable
  deprecated: false
  type: path
components:
  schemas:
    task:
      example:
        task_id: 046b6c7f-0b8a-43b9-b35d-6489e6daee91
        status: CREATED
      properties:
        task_id:
          description: Task identifier
          format: uuid
          type: string
        status:
          description: Task status
          enum:
            - CREATED
            - IN_PROGRESS
            - COMPLETED
            - FAILED
          type: string
      required:
        - status
        - task_id
      type: object
    wan-v22-aspect-ratio:
      default: auto
      description: Video aspect ratio.`
      enum:
        - auto
        - widescreen_16_9
        - social_story_9_16
        - square_1_1
        - classic_4_3
      example: auto
      type: string
    get_all_style_transfer_tasks_400_response_1_problem_invalid_params_inner:
      properties:
        name:
          example: page
          type: string
        reason:
          example: Parameter 'page' must be greater than 0
          type: string
      required:
        - name
        - reason
      type: object
    get_all_style_transfer_tasks_400_response_1_problem:
      properties:
        message:
          example: Your request parameters didn't validate.
          type: string
        invalid_params:
          items:
            $ref: >-
              #/components/schemas/get_all_style_transfer_tasks_400_response_1_problem_invalid_params_inner
          type: array
      required:
        - invalid_params
        - message
      type: object

````